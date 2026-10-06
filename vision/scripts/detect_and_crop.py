# scripts/detect_and_crop.py
# Detecta pets (dog/cat) com YOLOv8 e salva CROP(s) com nomes únicos.
# Versão com hashing do caminho de origem para garantir unicidade dos arquivos.
# Gera/atualiza outputs/crops_meta.json de forma append-safe.

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import List, Iterable

import cv2
from ultralytics import YOLO

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
OUT_DIR = Path("outputs/crops")
META_PATH = Path("outputs/crops_meta.json")

# COCO classes relevantes
PET_CLASSES = [15, 16]  # 15=cat, 16=dog


def iter_images(roots: List[Path]) -> Iterable[Path]:
    """Itera recursivamente por todas as imagens válidas nas pastas raiz."""
    for root in roots:
        for p in root.rglob("*"):
            if p.is_file() and p.suffix.lower() in IMG_EXTS:
                yield p


def as_posix_norm(p: str | Path) -> str:
    """Caminho normalizado e em POSIX, estável entre execuções."""
    try:
        return Path(p).resolve().as_posix()
    except Exception:
        return Path(p).as_posix()


def _safe_stem(src_path: Path) -> str:
    """
    Gera um 'stem' único combinando o nome-base da imagem com
    um hash curto do caminho absoluto normalizado.
    """
    try:
        norm = str(src_path.resolve()).replace("\\", "/").lower()
    except Exception:
        norm = str(src_path).replace("\\", "/").lower()
    h = hashlib.sha1(norm.encode("utf-8")).hexdigest()[:10]
    base = src_path.stem[:40]  # limita o tamanho do prefixo
    return f"{base}_{h}"


def main():
    parser = argparse.ArgumentParser(
        "Detecta pets e salva recortes (multi-pastas) com nomes únicos."
    )
    parser.add_argument(
        "--roots",
        nargs="+",
        required=True,
        help="Pastas de entrada (ex.: data/oxford_pets/images data/stanford_dogs/Images)",
    )
    parser.add_argument("--conf", type=float, default=0.35, help="Confiança mínima YOLO")
    parser.add_argument(
        "--min-edge", type=int, default=40, help="Menor lado mínimo do crop (px)"
    )
    args = parser.parse_args()

    roots = [Path(r).resolve() for r in args.roots]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    META_PATH.parent.mkdir(parents=True, exist_ok=True)

    # carrega meta existente (append seguro)
    meta = []
    if META_PATH.exists():
        try:
            meta = json.loads(META_PATH.read_text(encoding="utf-8"))
        except Exception:
            meta = []

    # conjunto para evitar duplicação de crops (normalizado)
    existing_crops = {as_posix_norm(m.get("crop")) for m in meta if m.get("crop")}

    model = YOLO("yolov8n.pt")

    added = 0
    for src_path in iter_images(roots):
        img = cv2.imread(str(src_path))
        if img is None:
            continue

        try:
            res = model.predict(
                img, classes=PET_CLASSES, conf=args.conf, verbose=False
            )[0]
        except Exception:
            continue

        for j, b in enumerate(res.boxes):
            x1, y1, x2, y2 = map(int, b.xyxy[0].tolist())
            crop = img[y1:y2, x1:x2]
            if crop.size == 0:
                continue
            if min(crop.shape[:2]) < args.min_edge:
                continue

            # -----------------------------
            # NOME ÚNICO (stem + hash + idx)
            # -----------------------------
            stem = _safe_stem(src_path)  # deriva do caminho da imagem de origem
            out_path = OUT_DIR / f"{stem}_{j}.jpg"
            k = 1
            # evita colisão com arquivos já existentes / meta antiga
            while as_posix_norm(out_path) in existing_crops or out_path.exists():
                out_path = OUT_DIR / f"{stem}_{j}_{k}.jpg"
                k += 1

            # salva o crop
            cv2.imwrite(str(out_path), crop)

            row = {
                "src": as_posix_norm(src_path),
                "crop": as_posix_norm(out_path),
                "cls": int(b.cls.item()),
                "conf": float(b.conf.item()),
            }
            meta.append(row)
            existing_crops.add(as_posix_norm(out_path))
            added += 1

    # grava meta (atômico simples)
    tmp = META_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, META_PATH)

    print(f"OK: {added} novos crops salvos em {OUT_DIR} | meta: {META_PATH}")


if __name__ == "__main__":
    main()
