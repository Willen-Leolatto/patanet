#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
eval_report.py
--------------
Generate a per-class Markdown report from an eval CSV created by
prepare_eval_and_grid.py, and (optionally) summarize the best grid-search params.

Usage:
  python scripts/eval_report.py --csv outputs/eval_results.csv --out outputs/eval_report.md
  # optionally include grid folder to embed best.json summary:
  python scripts/eval_report.py --csv outputs/eval_results.csv --out outputs/eval_report.md --grid outputs/grid
"""

import argparse
import csv
import json
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Any
import ast

def safe_list_parse(x: str):
    try:
        return ast.literal_eval(x)
    except Exception:
        try:
            return json.loads(x)
        except Exception:
            return []

def read_rows(csv_path: Path) -> List[Dict[str, Any]]:
    rows = []
    with csv_path.open("r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            rows.append(row)
    return rows

def class_stats(rows: List[Dict[str, Any]]) -> Dict[str, dict]:
    by_cls = defaultdict(list)
    for r in rows:
        if r.get("error"):
            continue
        gt = r.get("gt","").strip()
        by_cls[gt].append(r)

    out = {}
    for cls, lst in by_cls.items():
        n = len(lst)
        b1 = sum(int(x.get("breed_top1_ok",0)) for x in lst)
        b3 = sum(int(x.get("breed_top3_ok",0)) for x in lst)
        r1 = sum(int(x.get("ret_top1_ok",0)) for x in lst)
        r3 = sum(int(x.get("ret_top3_ok",0)) for x in lst)
        lat = [float(x.get("latency_ms",0) or 0) for x in lst]
        # top confusions (breed_top1)
        preds = [x.get("breed_top1","") for x in lst if x.get("breed_top1")]
        conf = Counter([p for p in preds if p != cls]).most_common(5)
        out[cls] = {
            "count": n,
            "breed_top1": b1/n if n else 0.0,
            "breed_top3": b3/n if n else 0.0,
            "retr_top1": r1/n if n else 0.0,
            "retr_top3": r3/n if n else 0.0,
            "latency_ms_avg": sum(lat)/len(lat) if lat else 0.0,
            "confusions": conf
        }
    return out

def overall_stats(rows: List[Dict[str, Any]]) -> dict:
    rows_ok = [r for r in rows if not r.get("error")]
    n = len(rows_ok)
    if n == 0:
        return {"count": 0}
    b1 = sum(int(x.get("breed_top1_ok",0)) for x in rows_ok)
    b3 = sum(int(x.get("breed_top3_ok",0)) for x in rows_ok)
    r1 = sum(int(x.get("ret_top1_ok",0)) for x in rows_ok)
    r3 = sum(int(x.get("ret_top3_ok",0)) for x in rows_ok)
    lat = [float(x.get("latency_ms",0) or 0) for x in rows_ok]
    return {
        "count": n,
        "breed_top1": b1/n,
        "breed_top3": b3/n,
        "retr_top1": r1/n,
        "retr_top3": r3/n,
        "latency_ms_avg": sum(lat)/len(lat) if lat else 0.0,
    }

def grid_best(grid_dir: Path) -> dict:
    bj = grid_dir / "best.json"
    if bj.exists():
        try:
            return json.loads(bj.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}

def to_pct(x: float) -> str:
    return f"{100.0*float(x):.1f}%"

def write_md(out_path: Path, rows: List[Dict[str, Any]], per_cls: Dict[str, dict], overall: dict, grid: dict):
    cls_sorted = sorted(per_cls.items(), key=lambda kv: kv[0])
    worst = sorted(per_cls.items(), key=lambda kv: kv[1]["breed_top1"])[:10]
    best  = sorted(per_cls.items(), key=lambda kv: -kv[1]["breed_top1"])[:10]

    with out_path.open("w", encoding="utf-8") as f:
        f.write("# PataNet Vision — Relatório de Avaliação\n\n")
        f.write(f"- Total de imagens avaliadas: **{overall.get('count',0)}**\n")
        f.write(f"- Breed Top-1: **{to_pct(overall.get('breed_top1',0))}**  | Top-3: **{to_pct(overall.get('breed_top3',0))}**\n")
        f.write(f"- Retrieval Top-1: **{to_pct(overall.get('retr_top1',0))}**  | Top-3: **{to_pct(overall.get('retr_top3',0))}**\n")
        f.write(f"- Latência média: **{overall.get('latency_ms_avg',0):.1f} ms**\n\n")

        if grid:
            f.write("## Melhor conjunto de hiperparâmetros (grid)\n\n")
            f.write("```json\n")
            f.write(json.dumps(grid, indent=2))
            f.write("\n```\n\n")

        f.write("## Classes com melhor desempenho (Top-10 por Breed Top-1)\n\n")
        f.write("| Classe | Qtde | Breed@1 | Breed@3 | Retr@1 | Retr@3 | Lat(ms) |\n")
        f.write("|---|---:|---:|---:|---:|---:|---:|\n")
        for cls, st in best:
            f.write(f"| {cls} | {st['count']} | {to_pct(st['breed_top1'])} | {to_pct(st['breed_top3'])} | {to_pct(st['retr_top1'])} | {to_pct(st['retr_top3'])} | {st['latency_ms_avg']:.0f} |\n")
        f.write("\n")

        f.write("## Classes com pior desempenho (Top-10)\n\n")
        f.write("| Classe | Qtde | Breed@1 | Breed@3 | Retr@1 | Retr@3 | Lat(ms) | Confusões mais comuns |\n")
        f.write("|---|---:|---:|---:|---:|---:|---:|---|\n")
        for cls, st in worst:
            conf_line = ", ".join([f"{c}×{n}" for c,n in st["confusions"]]) if st["confusions"] else "-"
            f.write(f"| {cls} | {st['count']} | {to_pct(st['breed_top1'])} | {to_pct(st['breed_top3'])} | {to_pct(st['retr_top1'])} | {to_pct(st['retr_top3'])} | {st['latency_ms_avg']:.0f} | {conf_line} |\n")
        f.write("\n")

        f.write("## Resultados por classe (completos)\n\n")
        f.write("| Classe | Qtde | Breed@1 | Breed@3 | Retr@1 | Retr@3 | Lat(ms) | Confusões |\n")
        f.write("|---|---:|---:|---:|---:|---:|---:|---|\n")
        for cls, st in cls_sorted:
            conf_line = ", ".join([f"{c}×{n}" for c,n in st["confusions"]]) if st["confusions"] else "-"
            f.write(f"| {cls} | {st['count']} | {to_pct(st['breed_top1'])} | {to_pct(st['breed_top3'])} | {to_pct(st['retr_top1'])} | {to_pct(st['retr_top3'])} | {st['latency_ms_avg']:.0f} | {conf_line} |\n")

def main():
    ap = argparse.ArgumentParser(description="Generate Markdown report from eval CSV")
    ap.add_argument("--csv", type=Path, required=True, help="CSV from prepare_eval_and_grid.py eval")
    ap.add_argument("--out", type=Path, required=True, help="Output Markdown file")
    ap.add_argument("--grid", type=Path, default=None, help="Grid directory (to include best.json)")
    args = ap.parse_args()

    rows = read_rows(args.csv)
    per_cls = class_stats(rows)
    overall = overall_stats(rows)
    grid = grid_best(args.grid) if args.grid else {}

    args.out.parent.mkdir(parents=True, exist_ok=True)
    write_md(args.out, rows, per_cls, overall, grid)
    print(f"Report written to: {args.out}")

if __name__ == "__main__":
    main()
