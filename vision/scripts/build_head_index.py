# scripts/build_head_index.py
# Constrói (ou atualiza) o índice de "head embeddings" (index/head.faiss)
# a partir do meta final index/pets_meta.json (1-para-1 com o índice principal).
# Versão VERBOSE:
#  - Batching + checkpoints
#  - Retomada (resume) com --start
#  - Opção --rebuild para recriar do zero
#  - Logs detalhados de falha com relatório CSV em outputs/head_build_report.csv
#  - Salvamento atômico e paths POSIX

import os
import json
import csv
import argparse
from pathlib import Path
from typing import List, Tuple, Optional

import numpy as np
import cv2
from PIL import Image
from tqdm import tqdm

import faiss
import torch
from transformers import CLIPModel, CLIPProcessor

# =========================
# CONFIG DEFAULTS
# =========================
MODEL_ID = "openai/clip-vit-base-patch32"
USE_FAST = True

INDEX_DIR    = Path("index")
PETS_META    = INDEX_DIR / "pets_meta.json"   # meta final (do build_index.py)
HEAD_INDEX   = INDEX_DIR / "head.faiss"
HEAD_META    = INDEX_DIR / "head_meta.json"

HF_CACHE     = Path("hf_cache")
OUTPUTS_DIR  = Path("outputs")
REPORT_CSV   = OUTPUTS_DIR / "head_build_report.csv"

BATCH_SIZE_DEFAULT     = 32
CHECKPOINT_EVERY_DEFAULT = 500    # salva a cada N imagens
LOG_EVERY_DEFAULT      = 200      # imprime progresso detalhado a cada N

# =========================
# Helpers
# =========================
def as_posix(p: str | Path) -> str:
    try:
        return Path(p).resolve().as_posix()
    except Exception:
        return Path(p).as_posix()

def save_index_atomic(index: faiss.Index, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    faiss.write_index(index, str(tmp))
    os.replace(tmp, path)

def save_meta_atomic(rows: List[dict], path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)

def load_existing() -> Tuple[Optional[faiss.Index], List[dict]]:
    if HEAD_INDEX.exists() and HEAD_META.exists():
        idx = faiss.read_index(str(HEAD_INDEX))
        rows = json.loads(HEAD_META.read_text(encoding="utf-8"))
        return idx, rows
    return None, []

def extract_head_crop_from_bgr(bgr: np.ndarray, haar: Optional[cv2.CascadeClassifier]) -> np.ndarray:
    """
    Tenta detectar face/cabeça (haar de gato) e faz um crop com padding.
    Se não encontrar, usa fallback da banda superior central.
    """
    h, w = bgr.shape[:2]
    if haar is not None:
        try:
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            faces = haar.detectMultiScale(gray, 1.1, 3)
            if len(faces):
                x, y, ww, hh = max(faces, key=lambda r: r[2]*r[3])
                pad = int(0.15 * max(ww, hh))
                x1 = max(0, x - pad); y1 = max(0, y - pad)
                x2 = min(w, x + ww + pad); y2 = min(h, y + hh + pad)
                crop = bgr[y1:y2, x1:x2]
                if crop.size > 0:
                    return crop
        except Exception:
            pass
    # fallback topo-central
    y2 = int(0.55 * h); x1 = int(0.15 * w); x2 = int(0.85 * w)
    crop = bgr[:y2, x1:x2]
    return crop if crop.size else bgr

def embed_batch(proc: CLIPProcessor, model: CLIPModel, imgs: List[Image.Image], device: str) -> np.ndarray:
    inputs = proc(images=[im.convert("RGB") for im in imgs],
                  return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        e = model.get_image_features(**inputs)
    e = torch.nn.functional.normalize(e, dim=-1)
    return e.cpu().numpy().astype("float32")

# =========================
# Verbose Reporter
# =========================
class Reporter:
    def __init__(self, csv_path: Path):
        self.csv_path = csv_path
        self.rows = []
        self.counts = {
            "total": 0,
            "opened_ok": 0,
            "not_found": 0,
            "read_fail": 0,
            "empty_crop": 0,
            "encoded": 0,
            "skipped": 0,     # reservado para usos futuros
        }

    def log_total(self, n: int):
        self.counts["total"] = n

    def add_ok(self):
        self.counts["opened_ok"] += 1

    def add_not_found(self, idx: int, crop: str):
        self.counts["not_found"] += 1
        self.rows.append({"i": idx, "crop": crop, "reason": "not_found"})

    def add_read_fail(self, idx: int, crop: str):
        self.counts["read_fail"] += 1
        self.rows.append({"i": idx, "crop": crop, "reason": "read_fail"})

    def add_empty_crop(self, idx: int, crop: str):
        self.counts["empty_crop"] += 1
        self.rows.append({"i": idx, "crop": crop, "reason": "empty_crop"})

    def add_encoded(self, n: int):
        self.counts["encoded"] += n

    def flush_csv(self):
        self.csv_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["i", "crop", "reason"])
            w.writeheader()
            for r in self.rows:
                w.writerow(r)

    def print_summary(self):
        c = self.counts
        print("\n==== Head Build Summary ====")
        print(f"Total alvos no PETS_META : {c['total']}")
        print(f"Imagens abertas com sucesso: {c['opened_ok']}")
        print(f"Falhas: not_found={c['not_found']} | read_fail={c['read_fail']} | empty_crop={c['empty_crop']}")
        print(f"Embeddings codificados     : {c['encoded']}")
        print(f"Relatório CSV              : {self.csv_path.as_posix()}")
        print("============================\n")

# =========================
# MAIN
# =========================
def main():
    parser = argparse.ArgumentParser(description="Build head index (verbose).")
    parser.add_argument("--rebuild", action="store_true", help="Recria head.faiss e head_meta.json do zero.")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE_DEFAULT, help="Tamanho do batch (default: 32).")
    parser.add_argument("--checkpoint-every", type=int, default=CHECKPOINT_EVERY_DEFAULT, help="Itens por checkpoint.")
    parser.add_argument("--log-every", type=int, default=LOG_EVERY_DEFAULT, help="Itens por log detalhado.")
    parser.add_argument("--start", type=int, default=0, help="Índice inicial (resume manual).")
    parser.add_argument("--max", type=int, default=0, help="Processa no máximo N itens (0 = todos).")
    args = parser.parse_args()

    # Ambiente / diretórios
    os.environ.setdefault("HF_HOME", str(HF_CACHE.resolve()))
    HF_CACHE.mkdir(parents=True, exist_ok=True)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    # Meta principal
    if not PETS_META.exists():
        raise FileNotFoundError(
            f"Não encontrei {PETS_META}. Rode scripts/build_index.py (padrão novo) primeiro."
        )
    all_meta: List[dict] = json.loads(PETS_META.read_text(encoding="utf-8"))
    total = len(all_meta)

    # Reporter
    rep = Reporter(REPORT_CSV)
    rep.log_total(total)

    # Rebuild?
    if args.rebuild:
        if HEAD_INDEX.exists():
            HEAD_INDEX.unlink()
        if HEAD_META.exists():
            HEAD_META.unlink()
        print("[rebuild] head index/metadata removidos.")

    # Retomada
    head_index, head_rows = load_existing()
    start_at = max(args.start, len(head_rows) if head_rows else 0)
    if head_index is None:
        print("Iniciando head index do zero.")
    else:
        print(f"Retomando head index: {len(head_rows)} de {total} já processados (start_at={start_at}).")

    # Device e modelo
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = CLIPModel.from_pretrained(MODEL_ID).to(device).eval()
    proc  = CLIPProcessor.from_pretrained(MODEL_ID, use_fast=USE_FAST)

    # Haar
    haar = None
    haar_path = cv2.data.haarcascades + "haarcascade_frontalcatface.xml"
    if os.path.exists(haar_path):
        haar = cv2.CascadeClassifier(haar_path)

    # Estado
    batch_imgs: List[Image.Image] = []
    batch_rows: List[dict] = []
    processed_since_ckpt = 0
    encoded_total = 0

    # Flush
    def flush_batch():
        nonlocal head_index, head_rows, processed_since_ckpt, batch_imgs, batch_rows, encoded_total
        if not batch_imgs:
            return
        X = embed_batch(proc, model, batch_imgs, device)  # [B, D]
        if head_index is None:
            head_index = faiss.IndexFlatIP(X.shape[1])

        head_index.add(X)

        # normaliza paths POSIX
        for m in batch_rows:
            if isinstance(m.get("crop"), str):
                m["crop"] = as_posix(m["crop"])
            if isinstance(m.get("src"), str):
                m["src"] = as_posix(m["src"])

        head_rows.extend(batch_rows)
        processed_since_ckpt += len(batch_imgs)
        encoded_total += len(batch_imgs)
        rep.add_encoded(len(batch_imgs))

        if processed_since_ckpt >= args.checkpoint_every:
            save_index_atomic(head_index, HEAD_INDEX)
            save_meta_atomic(head_rows, HEAD_META)
            processed_since_ckpt = 0
            print(f"[checkpoint] salvo: {len(head_rows)} itens.")

        batch_imgs.clear()
        batch_rows.clear()

    # Faixa a processar
    end_at = total
    if args.max and args.max > 0:
        end_at = min(total, start_at + args.max)

    # Loop principal
    pbar = tqdm(range(start_at, end_at), desc="Head embeddings (verbose)", unit="img")
    for i in pbar:
        m = all_meta[i]
        crop_path = m.get("crop")
        if not crop_path:
            rep.add_not_found(i, str(crop_path))
            continue

        p = Path(crop_path)
        if not p.is_absolute():
            p = Path.cwd() / p
        if not p.exists():
            rep.add_not_found(i, p.as_posix())
            continue

        bgr = cv2.imread(str(p), cv2.IMREAD_COLOR)
        if bgr is None:
            rep.add_read_fail(i, p.as_posix())
            continue

        head = extract_head_crop_from_bgr(bgr, haar)
        if head is None or head.size == 0:
            rep.add_empty_crop(i, p.as_posix())
            continue

        pil  = Image.fromarray(cv2.cvtColor(head, cv2.COLOR_BGR2RGB))
        batch_imgs.append(pil)
        batch_rows.append(m)
        rep.add_ok()

        if len(batch_imgs) >= args.batch_size:
            flush_batch()

        if args.log_every and ((i - start_at + 1) % args.log_every == 0):
            c = rep.counts
            print(f"[log] i={i} | ok={c['opened_ok']} | not_found={c['not_found']} | "
                  f"read_fail={c['read_fail']} | empty={c['empty_crop']} | encoded_total={encoded_total}")

    # Flush final + salvar
    flush_batch()
    if head_index is None:
        # nada processado — cria índice vazio com dim do CLIP ViT-B/32 (512)
        head_index = faiss.IndexFlatIP(512)
    save_index_atomic(head_index, HEAD_INDEX)
    save_meta_atomic(head_rows, HEAD_META)

    # Relatório
    rep.flush_csv()
    rep.print_summary()

    # Cobertura
    try:
        from faiss import read_index
        idx = read_index(str(HEAD_INDEX))
        print(f"OK: head index salvo em {HEAD_INDEX} | itens: {idx.ntotal}")
    except Exception:
        print(f"OK: head meta salvo em {HEAD_META} | itens: {len(head_rows)}")
    print("Dica: em /version da API, o head_lookup deve ficar próximo do ntotal (idealmente igual).")

if __name__ == "__main__":
    main()
