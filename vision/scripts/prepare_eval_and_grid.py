#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
prepare_eval_and_grid.py
---------------------------------
Curate um conjunto de avaliação a partir de Stanford Dogs / Oxford-IIIT Pet,
rodar avaliação contra a API do PataNet Vision e fazer grid-search.

Novidades deste patch:
- Métricas: hits@{1,3,5}, MRR@5, MAP@5, latência média e p95.
- Relatórios: hard_classes.csv, top_confusions.csv, confusion_matrix.csv, errors.log.
- Eval estável: SessionPool, retry/backoff, jitter opcional, estratificação (--cap-per-class).
- Grid:
    * Modo aleatório (--trials N)
    * Modo sweep por string (--sweep "w_krec=[0.4,0.6];krec_k1=[12,20]")
    * Modo sweep por JSON  (--sweep-json '{"w_krec":[0.4,0.6],"krec_k1":[12,20]}')
    * Objetivo configurável (--objective)
    * Salva resumo em CSV indicado por --out (pode ser diretório ou arquivo)
    * --save-trials para salvar/omitir CSVs individuais

Exemplos:

  # 1) Curar 20 imagens por classe para eval/
  python scripts/prepare_eval_and_grid.py curate --per-class 20 --dst eval

  # 2) Avaliar eval/ com 4 workers
  python scripts/prepare_eval_and_grid.py eval --api http://127.0.0.1:8000 --root eval \
      --workers 4 --out-csv outputs/eval_results.csv --cap-per-class 30 --resume

  # 3) Grid aleatório (120 trials) focado em raça
  python scripts/prepare_eval_and_grid.py grid --api http://127.0.0.1:8000 --root eval \
      --trials 120 --max-images 800 --objective breed_top1 --out outputs/grid

  # 4) Grid em sweep por string (Windows-friendly: tudo numa linha)
  python scripts/prepare_eval_and_grid.py grid --api http://127.0.0.1:8000 --root eval \
      --max-images 1500 \
      --sweep "w_krec=[0.4,0.6,0.8];w_head=[0.1,0.2,0.3];w_color=[0.05,0.1,0.2];krec_k1=[12,20,30];krec_k2=[4,6,8];krec_lambda=[0.1,0.3,0.5]" \
      --out outputs\\grid_results.csv

  # 5) Grid em sweep por JSON (aspas dobradas escapadas no PowerShell)
  python scripts/prepare_eval_and_grid.py grid --api http://127.0.0.1:8000 --root eval \
      --max-images 1500 \
      --sweep-json "{\"w_krec\":[0.4,0.6,0.8],\"w_head\":[0.1,0.2,0.3],\"w_color\":[0.05,0.1,0.2],\"krec_k1\":[12,20,30],\"krec_k2\":[4,6,8],\"krec_lambda\":[0.1,0.3,0.5]}" \
      --out outputs/grid_results.csv
"""

from __future__ import annotations

import argparse
import csv
import itertools
import json
import math
import os
import random
import re
import shutil
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Tuple, Iterable, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

# ===========================
# Config base
# ===========================

REQ_TIMEOUT = 60  # segundos
MAX_RETRY = 4
BACKOFF_BASE = 1.5  # multiplicador de backoff
DEFAULT_SLEEP_BETWEEN = 0.0  # seg. descanso entre requisições
JITTER_FRAC = 0.25  # fração p/ jitter do sleep_between (0.25 => +/-25%)

# ---------------------------
# Helpers de caminho/classes
# ---------------------------

def normpath(p: str) -> str:
    try:
        return str(Path(p).resolve()).replace("\\", "/").lower()
    except Exception:
        return str(Path(p)).replace("\\", "/").lower()

def stem_class_from_stanford(path: Path) -> Optional[str]:
    try:
        cls_folder = path.parent.name
        if "-" in cls_folder:
            return cls_folder.split("-", 1)[1]
        return None
    except Exception:
        return None

def stem_class_from_oxford(path: Path) -> Optional[str]:
    m = re.match(r"^([a-z_]+)_\d+\.(jpg|jpeg|png|webp)$", path.name, re.IGNORECASE)
    if m:
        return m.group(1).lower()
    return None

def infer_class_from_src(src: str) -> Optional[str]:
    try:
        p = Path(src)
    except Exception:
        return None
    parent = p.parent.name
    if "-" in parent and parent.split("-", 1)[1]:
        return parent.split("-", 1)[1].lower()
    m = re.match(r"^([a-z_]+)_\d+\.(jpg|jpeg|png|webp)$", p.name.lower())
    if m:
        return m.group(1).lower()
    return None

def iter_dataset_candidates(max_per_class: int = 999999) -> Dict[str, List[Path]]:
    out: Dict[str, List[Path]] = {}
    # Stanford Dogs
    sd = Path("data/stanford_dogs/Images")
    if sd.exists():
        for cls_dir in sd.glob("*"):
            if not cls_dir.is_dir():
                continue
            cls = None
            if "-" in cls_dir.name:
                cls = cls_dir.name.split("-", 1)[1]
            if not cls:
                continue
            imgs = sorted(list(cls_dir.glob("*.jpg")))
            if not imgs:
                continue
            out.setdefault(cls, [])
            out[cls].extend(imgs[:max_per_class])

    # Oxford-IIIT Pet
    op = Path("data/oxford_pets/images")
    if op.exists():
        for img_path in sorted(op.glob("*.jpg")):
            cls = stem_class_from_oxford(img_path)
            if not cls:
                continue
            out.setdefault(cls, [])
            out[cls].append(img_path)

    return out

def load_index_meta(meta_path: Path = Path("index/pets_meta.json")) -> List[dict]:
    if meta_path.exists():
        try:
            return json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []

def build_index_src_set(meta_rows: List[dict]) -> set:
    srcs = set()
    for r in meta_rows:
        src = r.get("src")
        if isinstance(src, str):
            srcs.add(normpath(src))
    return srcs

def curate_eval(dst: Path, per_class: int = 20, avoid_index_overlap: bool = True, seed: int = 42) -> Dict[str, int]:
    random.seed(seed)
    dst.mkdir(parents=True, exist_ok=True)

    meta_rows = load_index_meta()
    index_srcs = build_index_src_set(meta_rows) if avoid_index_overlap else set()

    candidates = iter_dataset_candidates(max_per_class=999999)

    copied_per_class: Dict[str, int] = {}
    for cls, paths in candidates.items():
        random.shuffle(paths)
        out_dir = dst / cls
        out_dir.mkdir(parents=True, exist_ok=True)

        count = 0
        for p in paths:
            if count >= per_class:
                break
            if normpath(p) in index_srcs:
                continue
            dst_path = out_dir / p.name
            i = 1
            while dst_path.exists():
                dst_path = out_dir / f"{p.stem}_{i}{p.suffix}"
                i += 1
            try:
                shutil.copy2(p, dst_path)
                count += 1
            except Exception:
                pass
        if count > 0:
            copied_per_class[cls] = count
    return copied_per_class

# ---------------------------
# HTTP helpers / SessionPool
# ---------------------------

@dataclass
class SearchParams:
    k: int = 5
    use_head: int = 1
    use_color: int = 1
    w_krec: float = 0.60
    w_head: float = 0.25
    w_color: float = 0.15
    krec_k1: int = 20
    krec_k2: int = 6
    krec_lambda: float = 0.30
    return_diagnostics: int = 0

    def to_form(self) -> Dict[str, str]:
        return {
            "k": str(self.k),
            "use_head": str(self.use_head),
            "use_color": str(self.use_color),
            "w_krec": str(self.w_krec),
            "w_head": str(self.w_head),
            "w_color": str(self.w_color),
            "krec_k1": str(self.krec_k1),
            "krec_k2": str(self.krec_k2),
            "krec_lambda": str(self.krec_lambda),
            "return_diagnostics": str(self.return_diagnostics),
        }

class SessionPool:
    """Pool simples de sessions para reuso de conexão por worker."""
    def __init__(self, size: int):
        self.pool = [requests.Session() for _ in range(max(1, size))]
        self._i = 0

    def get(self) -> requests.Session:
        s = self.pool[self._i % len(self.pool)]
        self._i += 1
        return s

def _sleep_with_jitter(base: float):
    if base <= 0:
        return
    j = base * JITTER_FRAC
    time.sleep(max(0.0, base + random.uniform(-j, j)))

def post_with_retry(session: requests.Session, url: str, files: dict, data: dict,
                    timeout: int, max_retry: int, sleep_between: float) -> requests.Response:
    attempt = 0
    last_exc = None
    while attempt <= max_retry:
        try:
            r = session.post(url, files=files, data=data, timeout=timeout)
            if r.status_code >= 500:
                raise requests.HTTPError(f"server {r.status_code}")
            return r
        except Exception as e:
            last_exc = e
            if attempt == max_retry:
                break
            back = (BACKOFF_BASE ** attempt)
            time.sleep(back)
        finally:
            _sleep_with_jitter(sleep_between)
        attempt += 1
    if isinstance(last_exc, Exception):
        raise last_exc
    raise RuntimeError("Failed to POST and reason unknown")

def call_search(session: requests.Session, api: str, img_path: Path, params: SearchParams,
                timeout: int = REQ_TIMEOUT, sleep_between: float = DEFAULT_SLEEP_BETWEEN) -> dict:
    files = {"file": (img_path.name, img_path.read_bytes(), "application/octet-stream")}
    data = params.to_form()
    r = post_with_retry(session, f"{api}/search", files=files, data=data,
                        timeout=timeout, max_retry=MAX_RETRY, sleep_between=sleep_between)
    r.raise_for_status()
    return r.json()

# ---------------------------
# Métricas utilitárias
# ---------------------------

def gt_from_subfolder(img_path: Path) -> str:
    return img_path.parent.name.lower()

def parse_breed_top3(resp: dict) -> Tuple[Optional[str], List[str]]:
    breed_top3 = []
    for it in resp.get("breed_top3", []):
        lbl = it.get("label")
        if isinstance(lbl, str):
            breed_top3.append(lbl.lower())
    breed_top1 = breed_top3[0] if breed_top3 else None
    return breed_top1, breed_top3

def topk_src_classes(resp: dict, k: int = 5) -> List[str]:
    clss = []
    for it in resp.get("topk", [])[:k]:
        src = (it.get("src") or "")
        clss.append(infer_class_from_src(src) or "")
    return clss

def ap_at_k(gt: str, ranked: List[str], k: int = 5) -> float:
    """AP@k binário (mesma classe = relevante)."""
    if k <= 0:
        return 0.0
    hits = 0
    score = 0.0
    for i, c in enumerate(ranked[:k], start=1):
        if c == gt:
            hits += 1
            score += hits / i
    return score / max(1, hits) if hits > 0 else 0.0

def rr_at_k(gt: str, ranked: List[str], k: int = 5) -> float:
    for i, c in enumerate(ranked[:k], start=1):
        if c == gt:
            return 1.0 / i
    return 0.0

# ---------------------------
# Avaliação
# ---------------------------

def walk_images(root: Path, cap_per_class: Optional[int] = None) -> List[Path]:
    """Lista imagens; se cap_per_class, limita por subpasta/classe para avaliação estratificada."""
    imgs_by_class: Dict[str, List[Path]] = {}
    for p in root.rglob("*"):
        if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
            cls = p.parent.name.lower()
            imgs_by_class.setdefault(cls, []).append(p)
    out: List[Path] = []
    for cls, lst in imgs_by_class.items():
        lst.sort()
        if cap_per_class is not None:
            out.extend(lst[:cap_per_class])
        else:
            out.extend(lst)
    out.sort()
    return out

def load_processed_set(csv_path: Path) -> set:
    done = set()
    try:
        with csv_path.open("r", encoding="utf-8") as f:
            r = csv.DictReader(f)
            for row in r:
                if "img" in row and row["img"]:
                    done.add(row["img"])
    except Exception:
        pass
    return done

def write_header_if_needed(csv_path: Path, fieldnames: List[str]):
    if not csv_path.exists():
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        with csv_path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()

def append_row(csv_path: Path, fieldnames: List[str], row: dict):
    with csv_path.open("a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writerow(row)

def p95(xs: List[float]) -> float:
    if not xs:
        return 0.0
    ys = sorted(xs)
    idx = int(math.ceil(0.95 * len(ys))) - 1
    idx = max(0, min(idx, len(ys) - 1))
    return float(ys[idx])

def eval_one(session: requests.Session, api: str, img_path: Path, params: SearchParams,
             timeout: int, sleep_between: float) -> dict:
    gt = gt_from_subfolder(img_path)
    try:
        resp = call_search(session, api, img_path, params, timeout=timeout, sleep_between=sleep_between)
    except Exception as e:
        return {"img": str(img_path), "gt": gt, "error": str(e)}

    breed_top1, breed_top3 = parse_breed_top3(resp)

    ranked = topk_src_classes(resp, k=max(5, params.k))
    hits1 = int(len(ranked) >= 1 and ranked[0] == gt)
    hits3 = int(gt in ranked[:3]) if ranked else 0
    hits5 = int(gt in ranked[:5]) if len(ranked) >= 5 else hits3

    row = {
        "img": str(img_path),
        "gt": gt,
        "breed_top1": breed_top1,
        "breed_top3": breed_top3,
        "breed_top1_ok": int(breed_top1 == gt) if breed_top1 else 0,
        "breed_top3_ok": int(gt in breed_top3) if breed_top3 else 0,
        "ret_top1_ok": hits1,
        "ret_top3_ok": hits3,
        "ret_top5_ok": hits5,
        "mrr5": rr_at_k(gt, ranked, k=5),
        "map5": ap_at_k(gt, ranked, k=5),
        "latency_ms": resp.get("latency_ms", None),
        "pred_ret_top1": ranked[0] if ranked else "",
        "error": None
    }
    return row

def eval_dataset(api: str, eval_root: Path, params: SearchParams,
                 out_csv: Path, max_images: Optional[int] = None,
                 workers: int = 4, timeout: int = REQ_TIMEOUT, sleep_between: float = DEFAULT_SLEEP_BETWEEN,
                 resume: bool = False, cap_per_class: Optional[int] = None) -> Dict[str, float]:
    all_imgs = walk_images(eval_root, cap_per_class=cap_per_class)
    if max_images:
        all_imgs = all_imgs[:max_images]

    processed = load_processed_set(out_csv) if resume else set()
    imgs = [p for p in all_imgs if str(p) not in processed]

    fieldnames = ["img", "gt", "breed_top1", "breed_top3",
                  "breed_top1_ok", "breed_top3_ok",
                  "ret_top1_ok", "ret_top3_ok", "ret_top5_ok",
                  "mrr5", "map5",
                  "latency_ms", "pred_ret_top1", "error"]

    write_header_if_needed(out_csv, fieldnames)

    # Acumuladores
    n = 0
    ok_b1 = ok_b3 = 0
    ok_r1 = ok_r3 = ok_r5 = 0
    sum_mrr5 = sum_map5 = 0.0
    latencies = []

    per_class_total: Dict[str, int] = {}
    per_class_b1: Dict[str, int] = {}
    per_class_b3: Dict[str, int] = {}
    per_class_r1: Dict[str, int] = {}
    per_class_r3: Dict[str, int] = {}
    per_class_r5: Dict[str, int] = {}
    per_class_mrr5: Dict[str, float] = {}
    per_class_map5: Dict[str, float] = {}

    conf: Dict[Tuple[str, str], int] = {}
    errors_log = out_csv.parent / "errors.log"

    # Recontagem se resume
    if resume and processed:
        try:
            with out_csv.open("r", encoding="utf-8") as f:
                r = csv.DictReader(f)
                for row in r:
                    if row.get("error"):
                        continue
                    gt = (row.get("gt") or "").lower()
                    b1_ok = int(row.get("breed_top1_ok", "0"))
                    b3_ok = int(row.get("breed_top3_ok", "0"))
                    r1_ok = int(row.get("ret_top1_ok", "0"))
                    r3_ok = int(row.get("ret_top3_ok", "0"))
                    r5_ok = int(row.get("ret_top5_ok", "0"))
                    mrr5 = float(row.get("mrr5", "0"))
                    map5 = float(row.get("map5", "0"))
                    pred_b1 = (row.get("breed_top1") or "").lower()
                    pred_ret1 = (row.get("pred_ret_top1") or "").lower()
                    lat = row.get("latency_ms")
                    if lat not in (None, "", "None"):
                        try:
                            latencies.append(float(lat))
                        except Exception:
                            pass

                    n += 1
                    ok_b1 += b1_ok
                    ok_b3 += b3_ok
                    ok_r1 += r1_ok
                    ok_r3 += r3_ok
                    ok_r5 += r5_ok
                    sum_mrr5 += mrr5
                    sum_map5 += map5

                    per_class_total[gt] = per_class_total.get(gt, 0) + 1
                    per_class_b1[gt] = per_class_b1.get(gt, 0) + b1_ok
                    per_class_b3[gt] = per_class_b3.get(gt, 0) + b3_ok
                    per_class_r1[gt] = per_class_r1.get(gt, 0) + r1_ok
                    per_class_r3[gt] = per_class_r3.get(gt, 0) + r3_ok
                    per_class_r5[gt] = per_class_r5.get(gt, 0) + r5_ok
                    per_class_mrr5[gt] = per_class_mrr5.get(gt, 0.0) + mrr5
                    per_class_map5[gt] = per_class_map5.get(gt, 0.0) + map5

                    if pred_b1:
                        conf[(gt, pred_b1)] = conf.get((gt, pred_b1), 0) + 1
                    if pred_ret1:
                        conf[(gt, pred_ret1)] = conf.get((gt, pred_ret1), 0) + 0
        except Exception:
            pass

    t0 = time.time()
    pool = SessionPool(size=max(1, workers))

    def _worker(p: Path) -> dict:
        session = pool.get()
        return eval_one(session, api, p, params, timeout=timeout, sleep_between=sleep_between)

    if imgs:
        with ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
            fut2img = {ex.submit(_worker, p): p for p in imgs}
            for i, fut in enumerate(as_completed(fut2img), 1):
                row = fut.result()
                append_row(out_csv, fieldnames, row)

                if row.get("error") is None:
                    gt = row["gt"]
                    pred_b1 = (row.get("breed_top1") or "").lower()
                    pred_ret1 = (row.get("pred_ret_top1") or "").lower()

                    n += 1
                    ok_b1 += row.get("breed_top1_ok", 0)
                    ok_b3 += row.get("breed_top3_ok", 0)
                    ok_r1 += row.get("ret_top1_ok", 0)
                    ok_r3 += row.get("ret_top3_ok", 0)
                    ok_r5 += row.get("ret_top5_ok", 0)
                    sum_mrr5 += float(row.get("mrr5", 0.0))
                    sum_map5 += float(row.get("map5", 0.0))
                    lat = row.get("latency_ms")
                    if lat not in (None, "", "None"):
                        try:
                            latencies.append(float(lat))
                        except Exception:
                            pass

                    per_class_total[gt] = per_class_total.get(gt, 0) + 1
                    per_class_b1[gt] = per_class_b1.get(gt, 0) + row.get("breed_top1_ok", 0)
                    per_class_b3[gt] = per_class_b3.get(gt, 0) + row.get("breed_top3_ok", 0)
                    per_class_r1[gt] = per_class_r1.get(gt, 0) + row.get("ret_top1_ok", 0)
                    per_class_r3[gt] = per_class_r3.get(gt, 0) + row.get("ret_top3_ok", 0)
                    per_class_r5[gt] = per_class_r5.get(gt, 0) + row.get("ret_top5_ok", 0)
                    per_class_mrr5[gt] = per_class_mrr5.get(gt, 0.0) + float(row.get("mrr5", 0.0))
                    per_class_map5[gt] = per_class_map5.get(gt, 0.0) + float(row.get("map5", 0.0))

                    if pred_b1:
                        conf[(gt, pred_b1)] = conf.get((gt, pred_b1), 0) + 1
                else:
                    with errors_log.open("a", encoding="utf-8") as ef:
                        ef.write(f"{row.get('img','?')}\t{row['error']}\n")
                    print(f"[warn] error on {row.get('img','?')}: {row['error']}")
                if i % 25 == 0:
                    print(f"[eval] {i}/{len(imgs)} concluídas (+{n} válidas até agora)")

    elapsed = time.time() - t0

    metrics = {
        "count": n,
        "breed_top1": ok_b1 / n if n else 0.0,
        "breed_top3": ok_b3 / n if n else 0.0,
        "retr_top1": ok_r1 / n if n else 0.0,
        "retr_top3": ok_r3 / n if n else 0.0,
        "retr_top5": ok_r5 / n if n else 0.0,
        "mrr5": (sum_mrr5 / n) if n else 0.0,
        "map5": (sum_map5 / n) if n else 0.0,
        "lat_mean_ms": (sum(latencies)/len(latencies)) if latencies else 0.0,
        "lat_p95_ms": p95(latencies),
        "elapsed_sec": elapsed,
    }

    out_dir = out_csv.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    # Per-class summary
    per_class_rows = []
    classes = sorted(per_class_total.keys())
    for c in classes:
        tot = per_class_total.get(c, 0)
        row = {
            "class": c,
            "count": tot,
            "breed_top1": (per_class_b1.get(c, 0) / tot) if tot else 0.0,
            "breed_top3": (per_class_b3.get(c, 0) / tot) if tot else 0.0,
            "retr_top1": (per_class_r1.get(c, 0) / tot) if tot else 0.0,
            "retr_top3": (per_class_r3.get(c, 0) / tot) if tot else 0.0,
            "retr_top5": (per_class_r5.get(c, 0) / tot) if tot else 0.0,
            "mrr5": (per_class_mrr5.get(c, 0.0) / tot) if tot else 0.0,
            "map5": (per_class_map5.get(c, 0.0) / tot) if tot else 0.0,
        }
        per_class_rows.append(row)
    with (out_dir / "per_class_summary.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["class", "count", "breed_top1", "breed_top3", "retr_top1", "retr_top3", "retr_top5", "mrr5", "map5"])
        w.writeheader()
        for r in per_class_rows:
            w.writerow(r)

    # Hard classes: ordena por menor breed_top1, depois menor mrr5
    hard_sorted = sorted(per_class_rows, key=lambda r: (r["breed_top1"], r["mrr5"]))
    with (out_dir / "hard_classes.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(per_class_rows[0].keys()) if per_class_rows else ["class","count"])
        w.writeheader()
        for r in hard_sorted:
            w.writerow(r)

    # Confusion matrix (predição breed_top1 vs gt)
    labels = sorted({gt for gt,_ in conf.keys()} | {pred for _,pred in conf.keys()})
    conf_path = out_dir / "confusion_matrix.csv"
    with conf_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["gt \\ pred"] + labels)
        for gt_label in labels:
            row = [gt_label]
            for pred_label in labels:
                row.append(conf.get((gt_label, pred_label), 0))
            w.writerow(row)

    # Top confusões
    conf_pairs = []
    for (gt_label, pred_label), cnt in conf.items():
        if gt_label != pred_label:
            conf_pairs.append({"gt": gt_label, "pred": pred_label, "count": cnt})
    conf_pairs.sort(key=lambda x: -x["count"])
    with (out_dir / "top_confusions.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["gt", "pred", "count"])
        w.writeheader()
        for r in conf_pairs:
            w.writerow(r)

    return metrics

# ---------------------------
# Grid Search (aleatória + sweep)
# ---------------------------

def random_grid_trial() -> SearchParams:
    w_k = random.uniform(0.4, 0.8)
    w_h = random.uniform(0.1, 0.4)
    w_c = random.uniform(0.0, 0.4)
    if w_k + w_h + w_c < 0.2:
        w_k += 0.4
    return SearchParams(
        k=5,
        use_head=1,
        use_color=1,
        w_krec=w_k,
        w_head=w_h,
        w_color=w_c,
        krec_k1=random.choice([12, 15, 18, 20, 25, 30]),
        krec_k2=random.choice([0, 4, 6, 8, 10]),
        krec_lambda=random.uniform(0.10, 0.50),
        return_diagnostics=0
    )

def objective_score(metrics: Dict[str, float], kind: str = "mixed") -> float:
    if kind == "breed_top1":
        return metrics.get("breed_top1", 0.0)
    if kind == "retrieval_focus":
        return 0.55 * metrics.get("retr_top1", 0.0) + 0.30 * metrics.get("retr_top3", 0.0) + 0.15 * metrics.get("mrr5", 0.0)
    # mixed (padrão)
    return 0.45 * metrics.get("retr_top1", 0.0) + 0.30 * metrics.get("retr_top3", 0.0) + 0.25 * metrics.get("breed_top1", 0.0)

# ---------- NEW: parsing de sweep ----------

# Mapeia nomes CLI (com/sem hífen) -> atributos da dataclass
NAME_MAP = {
    "k": "k",
    "use_head": "use_head", "use-head": "use_head",
    "use_color": "use_color", "use-color": "use_color",
    "w_krec": "w_krec", "w-krec": "w_krec",
    "w_head": "w_head", "w-head": "w_head",
    "w_color": "w_color", "w-color": "w_color",
    "krec_k1": "krec_k1", "krec-k1": "krec_k1",
    "krec_k2": "krec_k2", "krec-k2": "krec_k2",
    "krec_lambda": "krec_lambda", "krec-lambda": "krec_lambda",
}

def parse_list_value(text: str) -> List[float]:
    """
    Recebe algo como "[0.4,0.6,0.8]" e devolve lista de float/int.
    Tenta int quando não há ponto decimal.
    """
    text = text.strip()
    if not (text.startswith("[") and text.endswith("]")):
        raise ValueError("esperado formato [a,b,c]")
    inner = text[1:-1].strip()
    if not inner:
        return []
    parts = [p.strip() for p in inner.split(",")]
    vals: List[float] = []
    for p in parts:
        if re.match(r"^-?\d+$", p):
            vals.append(int(p))
        else:
            vals.append(float(p))
    return vals

def parse_sweep_expr(expr: str) -> Dict[str, List[float]]:
    """
    Ex.: "w_krec=[0.4,0.6];w_head=[0.1,0.2];krec_k1=[12,20]"
    """
    out: Dict[str, List[float]] = {}
    if not expr:
        return out
    for chunk in expr.split(";"):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "=" not in chunk:
            raise ValueError(f"item inválido em --sweep: {chunk}")
        k, v = chunk.split("=", 1)
        k = k.strip()
        v = v.strip()
        name = NAME_MAP.get(k, None)
        if name is None:
            raise ValueError(f"parâmetro desconhecido em --sweep: {k}")
        out[name] = parse_list_value(v)
    return out

def expand_sweep_to_params(sweep: Dict[str, List[float]]) -> List[SearchParams]:
    """
    Varre o produto cartesiano das listas e gera SearchParams.
    Parâmetros não citados usam o default da dataclass.
    """
    base = SearchParams()
    # chaves/valores como listas
    keys = list(sweep.keys())
    values = [sweep[k] for k in keys]
    combos = list(itertools.product(*values)) if values else []
    params_list: List[SearchParams] = []
    if not combos:
        return [base]
    for combo in combos:
        p = SearchParams(**asdict(base))
        for k, val in zip(keys, combo):
            setattr(p, k, val)
        params_list.append(p)
    return params_list

def local_refine(params: SearchParams) -> List[SearchParams]:
    """Gera vizinhança para refino."""
    deltas = [-2, -1, 0, 1, 2]
    outs = []
    for dk1 in deltas:
        for dk2 in [-2, -1, 0, 1, 2]:
            for dl in [-0.05, -0.03, 0, 0.03, 0.05]:
                for dwk in [-0.05, 0, 0.05]:
                    for dwh in [-0.05, 0, 0.05]:
                        for dwc in [-0.05, 0, 0.05]:
                            p = SearchParams(
                                k=params.k,
                                use_head=params.use_head,
                                use_color=params.use_color,
                                w_krec=max(0.0, min(1.0, params.w_krec + dwk)),
                                w_head=max(0.0, min(1.0, params.w_head + dwh)),
                                w_color=max(0.0, min(1.0, params.w_color + dwc)),
                                krec_k1=max(5, params.krec_k1 + dk1),
                                krec_k2=max(0, params.krec_k2 + dk2),
                                krec_lambda=max(0.05, min(0.9, params.krec_lambda + dl)),
                                return_diagnostics=0
                            )
                            outs.append(p)
    uniq = {(p.krec_k1, p.krec_k2, round(p.krec_lambda,3), round(p.w_krec,3), round(p.w_head,3), round(p.w_color,3)): p for p in outs}
    return list(uniq.values())

def ensure_out_paths(out: Path, save_trials: bool) -> Tuple[Path, Path]:
    """
    Se --out termina em .csv => usamos como summary_csv e criamos subdir 'trials' ao lado p/ CSVs.
    Caso contrário, --out é diretório (summary=out/grid_summary.csv; trials dentro de out/).
    Retorna (summary_csv, trials_dir). Se save_trials=False, trials_dir ainda é retornado, mas pode ser ignorado.
    """
    out = out.resolve()
    if out.suffix.lower() == ".csv":
        out.parent.mkdir(parents=True, exist_ok=True)
        summary_csv = out
        trials_dir = out.parent / "trials"
        trials_dir.mkdir(parents=True, exist_ok=True)
        return summary_csv, trials_dir
    else:
        out.mkdir(parents=True, exist_ok=True)
        summary_csv = out / "grid_summary.csv"
        trials_dir = out / "trials"
        trials_dir.mkdir(parents=True, exist_ok=True)
        return summary_csv, trials_dir

def grid_search(api: str, eval_root: Path, *,
                trials: int = 0,
                sweep: Optional[Dict[str, List[float]]] = None,
                max_images: Optional[int] = None,
                out_path: Path = Path("outputs/grid"),
                workers: int = 2, timeout: int = REQ_TIMEOUT,
                sleep_between: float = 0.0, objective: str = "mixed",
                save_trials: bool = True) -> Dict[str, float]:
    summary_csv, trials_dir = ensure_out_paths(out_path, save_trials)

    best = None
    best_params = None
    summary_rows = []

    def run_one(p: SearchParams, tag: str):
        out_csv = (trials_dir / f"{tag}.csv") if save_trials else (trials_dir / f"__tmp.csv")
        metrics = eval_dataset(
            api, eval_root, p,
            out_csv=out_csv, max_images=max_images,
            workers=workers, timeout=timeout,
            sleep_between=sleep_between, resume=False
        )
        obj = objective_score(metrics, kind=objective)
        row = {"trial": tag, "objective": obj, **asdict(p), **metrics}
        summary_rows.append(row)
        return obj, metrics

    # --- modo sweep explícito ---
    if sweep and len(sweep) > 0:
        params_list = expand_sweep_to_params(sweep)
        for idx, p in enumerate(params_list, 1):
            obj, metrics = run_one(p, tag=f"sweep_{idx:04d}")
            if best is None or obj > best:
                best, best_params = obj, (p, metrics)
            print(f"[sweep {idx}/{len(params_list)}] obj={obj:.4f} breed@1={metrics['breed_top1']:.3f} "
                  f"retr@1={metrics['retr_top1']:.3f} retr@3={metrics['retr_top3']:.3f} "
                  f"k1={p.krec_k1} k2={p.krec_k2} λ={p.krec_lambda:.2f} "
                  f"w=({p.w_krec:.2f},{p.w_head:.2f},{p.w_color:.2f})")

    # --- modo aleatório (se trials > 0) ---
    if (trials or 0) > 0:
        for t in range(1, trials + 1):
            p = random_grid_trial()
            obj, metrics = run_one(p, tag=f"trial_{t:04d}")
            if best is None or obj > best:
                best, best_params = obj, (p, metrics)
            print(f"[trial {t}/{trials}] obj={obj:.4f} breed@1={metrics['breed_top1']:.3f} "
                  f"retr@1={metrics['retr_top1']:.3f} retr@3={metrics['retr_top3']:.3f} "
                  f"k1={p.krec_k1} k2={p.krec_k2} λ={p.krec_lambda:.2f} "
                  f"w=({p.w_krec:.2f},{p.w_head:.2f},{p.w_color:.2f})")

    # refino local (apenas se houve algo rodado)
    if best_params is not None:
        base_params, _ = best_params
        neigh = local_refine(base_params)
        print(f"[refine] explorando {len(neigh)} vizinhos do melhor...")
        for j, p in enumerate(neigh, 1):
            obj, metrics = run_one(p, tag=f"refine_{j:04d}")
            if obj > best:
                best, best_params = obj, (p, metrics)
                print(f"[refine] novo melhor obj={obj:.4f} k1={p.krec_k1} k2={p.krec_k2} λ={p.krec_lambda:.2f} "
                      f"w=({p.w_krec:.2f},{p.w_head:.2f},{p.w_color:.2f})")

    # summary
    if summary_rows:
        with summary_csv.open("w", newline="", encoding="utf-8") as f:
            fnames = list(summary_rows[0].keys())
            w = csv.DictWriter(f, fieldnames=fnames)
            w.writeheader()
            for r in summary_rows:
                w.writerow(r)

    # best.json-like retorno
    best_json = {
        "best_objective": best,
        "best_params": asdict(best_params[0]) if best_params else None,
        "best_metrics": best_params[1] if best_params else None,
        "objective": objective,
        "summary_csv": str(summary_csv),
        "trials_dir": str(trials_dir) if save_trials else None,
    }
    # também salva ao lado do CSV
    Path(str(summary_csv).replace(".csv", "_best.json")).write_text(json.dumps(best_json, indent=2), encoding="utf-8")
    return best_json

# ---------------------------
# CLI
# ---------------------------

def main():
    ap = argparse.ArgumentParser(description="Curate eval set e rodar eval/grid contra a PataNet Vision API")
    sub = ap.add_subparsers(dest="cmd", required=True)

    # curate
    ap_cur = sub.add_parser("curate", help="Curar eval/ a partir dos datasets")
    ap_cur.add_argument("--dst", type=Path, default=Path("eval"))
    ap_cur.add_argument("--per-class", type=int, default=20)
    ap_cur.add_argument("--avoid-index-overlap", action="store_true", default=True)
    ap_cur.add_argument("--seed", type=int, default=42)

    # eval
    ap_eval = sub.add_parser("eval", help="Avaliar uma pasta eval/")
    ap_eval.add_argument("--api", type=str, default="http://127.0.0.1:8000")
    ap_eval.add_argument("--root", type=Path, default=Path("eval"))
    ap_eval.add_argument("--k", type=int, default=5)
    ap_eval.add_argument("--use-head", type=int, default=1)
    ap_eval.add_argument("--use-color", type=int, default=1)
    ap_eval.add_argument("--w-krec", type=float, default=0.60)
    ap_eval.add_argument("--w-head", type=float, default=0.25)
    ap_eval.add_argument("--w-color", type=float, default=0.15)
    ap_eval.add_argument("--krec-k1", type=int, default=20)
    ap_eval.add_argument("--krec-k2", type=int, default=6)
    ap_eval.add_argument("--krec-lambda", type=float, default=0.30)
    ap_eval.add_argument("--max-images", type=int, default=None)
    ap_eval.add_argument("--out-csv", type=Path, default=Path("outputs/eval_results.csv"))
    ap_eval.add_argument("--workers", type=int, default=4)
    ap_eval.add_argument("--timeout", type=int, default=REQ_TIMEOUT)
    ap_eval.add_argument("--sleep-between", type=float, default=DEFAULT_SLEEP_BETWEEN)
    ap_eval.add_argument("--resume", action="store_true", help="Retomar CSV existente e pular imagens já processadas")
    ap_eval.add_argument("--cap-per-class", type=int, default=None, help="Limite por classe p/ avaliação estratificada")

    # grid
    ap_grid = sub.add_parser("grid", help="Grid-search aleatória e/ou por sweep")
    ap_grid.add_argument("--api", type=str, default="http://127.0.0.1:8000")
    ap_grid.add_argument("--root", type=Path, default=Path("eval"))
    ap_grid.add_argument("--trials", type=int, default=0, help="Nº de trials aleatórios (0 para desativar)")
    ap_grid.add_argument("--max-images", type=int, default=None)

    # novo: escolher saída
    ap_grid.add_argument("--out", type=Path, default=Path("outputs/grid"),
                         help="Diretório OU arquivo CSV de resumo (ex.: outputs/grid_results.csv)")

    ap_grid.add_argument("--workers", type=int, default=2)
    ap_grid.add_argument("--timeout", type=int, default=REQ_TIMEOUT)
    ap_grid.add_argument("--sleep-between", type=float, default=DEFAULT_SLEEP_BETWEEN)
    ap_grid.add_argument("--objective", type=str, default="mixed",
                         choices=["mixed","breed_top1","retrieval_focus"])
    ap_grid.add_argument("--save-trials", action="store_true", default=True,
                         help="Salvar CSV individual de cada trial (default ligado)")

    # modos de sweep
    ap_grid.add_argument("--sweep", type=str, default=None,
                         help='Ex.: "w_krec=[0.4,0.6];krec_k1=[12,20]"')
    ap_grid.add_argument("--sweep-json", type=str, default=None,
                         help='Ex.: {"w_krec":[0.4,0.6],"krec_k1":[12,20]}')

    args = ap.parse_args()

    if args.cmd == "curate":
        copied = curate_eval(dst=args.dst, per_class=args.per_class,
                             avoid_index_overlap=args.avoid_index_overlap, seed=args.seed)
        total = sum(copied.values()) if copied else 0
        print("=== Curate Summary ===")
        print(f"dst        : {args.dst}")
        print(f"per-class  : {args.per_class}")
        print(f"avoid-index: {args.avoid_index_overlap}")
        print(f"classes    : {len(copied)}")
        print(f"total imgs : {total}")
        for k, v in sorted(copied.items(), key=lambda kv: (-kv[1], kv[0]))[:20]:
            print(f"  {k:>24s}: {v}")
        return

    if args.cmd == "eval":
        params = SearchParams(
            k=args.k, use_head=args.use_head, use_color=args.use_color,
            w_krec=args.w_krec, w_head=args.w_head, w_color=args.w_color,
            krec_k1=args.krec_k1, krec_k2=args.krec_k2, krec_lambda=args.krec_lambda,
            return_diagnostics=0
        )
        metrics = eval_dataset(
            args.api, args.root, params, out_csv=args.out_csv,
            max_images=args.max_images, workers=args.workers,
            timeout=args.timeout, sleep_between=args.sleep_between,
            resume=args.resume, cap_per_class=args.cap_per_class
        )
        print("=== Eval Summary ===")
        print(json.dumps(metrics, indent=2))
        print(f"CSV salvo em: {args.out_csv}")
        print(f"Per-class   : {args.out_csv.parent / 'per_class_summary.csv'}")
        print(f"Hard cls    : {args.out_csv.parent / 'hard_classes.csv'}")
        print(f"Confusion   : {args.out_csv.parent / 'confusion_matrix.csv'}")
        print(f"Top conf    : {args.out_csv.parent / 'top_confusions.csv'}")
        print(f"Errors      : {args.out_csv.parent / 'errors.log'}")
        return

    if args.cmd == "grid":
        # preparar sweep (se houver)
        sweep_dict: Optional[Dict[str, List[float]]] = None
        if args.sweep:
            try:
                sweep_dict = parse_sweep_expr(args.sweep)
            except Exception as e:
                print(f"[erro] parsing --sweep: {e}", file=sys.stderr)
                sys.exit(2)
        elif args.sweep_json:
            try:
                raw = json.loads(args.sweep_json)
                # normaliza chaves conforme NAME_MAP
                sweep_dict = {}
                for k, v in raw.items():
                    name = NAME_MAP.get(k, None)
                    if name is None:
                        raise ValueError(f"parâmetro desconhecido em --sweep-json: {k}")
                    if not isinstance(v, (list, tuple)):
                        raise ValueError(f"valor de {k} deve ser lista")
                    sweep_dict[name] = list(v)
            except Exception as e:
                print(f"[erro] parsing --sweep-json: {e}", file=sys.stderr)
                sys.exit(2)

        best = grid_search(
            args.api, args.root,
            trials=max(0, int(args.trials)),
            sweep=sweep_dict,
            max_images=args.max_images,
            out_path=args.out,
            workers=args.workers, timeout=args.timeout,
            sleep_between=args.sleep_between, objective=args.objective,
            save_trials=bool(args.save_trials)
        )
        print("=== Grid Best ===")
        print(json.dumps(best, indent=2))
        # dica de caminho
        if str(best.get("summary_csv")):
            print(f"Resumo: {best['summary_csv']}")
        if best.get("trials_dir"):
            print(f"Trials: {best['trials_dir']}")
        return

if __name__ == "__main__":
    main()
