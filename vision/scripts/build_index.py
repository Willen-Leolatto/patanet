# scripts/build_index.py
# Constrói (ou atualiza) o índice FAISS e o meta a partir de outputs/crops_meta.json
# Patches:
#  - hsv_hist salvo no meta (32H + 32S) → acelera /search
#  - normalização de paths (POSIX) e preferência por caminhos relativos
#  - retoma de onde parou, checkpoint periódico

import os
import json
from pathlib import Path
from typing import List, Tuple

import numpy as np
from PIL import Image
from tqdm import tqdm
import cv2

import faiss
import torch
from transformers import CLIPModel, CLIPProcessor

# =========================
# CONFIG
# =========================
MODEL_ID = "openai/clip-vit-base-patch32"
USE_FAST = True

CROP_META_PATH = Path("outputs/crops_meta.json")

INDEX_DIR  = Path("index")
INDEX_PATH = INDEX_DIR / "pets.faiss"
META_PATH  = INDEX_DIR / "pets_meta.json"

HF_CACHE = Path("hf_cache")
BATCH_SIZE = 32
CHECKPOINT_EVERY = 500  # salva a cada N imagens

# Raízes candidatas para relativizar caminhos (ajuste se necessário)
PROJECT_ROOT = Path.cwd()
DATA_ROOTS = [
    PROJECT_ROOT,
    PROJECT_ROOT / "data",
    PROJECT_ROOT / "outputs",
]

# =========================
# Helpers
# =========================
def as_posix_rel(p: str | Path) -> str:
    """
    Converte para Path, tenta relativizar a uma das raízes conhecidas e retorna em POSIX (/).
    Se não for possível, retorna POSIX absoluto.
    """
    try:
        pp = Path(p)
        pr = pp.resolve()
    except Exception:
        # caminho pode não existir (ex.: remoto), padroniza mesmo assim
        return Path(p).as_posix()

    for root in DATA_ROOTS:
        try:
            rel = pr.relative_to(root.resolve())
            return rel.as_posix()
        except Exception:
            continue
    return pr.as_posix()

def color_hist_hsv(img_bgr: np.ndarray) -> np.ndarray:
    """
    Histograma HSV compacto:
      - H: 32 bins (0..180)
      - S: 32 bins (0..256)
    Retorna vetor (64,) normalizado.
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([hsv], [0], None, [32], [0, 180])
    s = cv2.calcHist([hsv], [1], None, [32], [0, 256])
    # normaliza (L1) para comparações por interseção
    h = cv2.normalize(h, None, alpha=1.0, norm_type=cv2.NORM_L1).flatten()
    s = cv2.normalize(s, None, alpha=1.0, norm_type=cv2.NORM_L1).flatten()
    return np.concatenate([h, s]).astype("float32")

# =========================
# Setup
# =========================
os.environ.setdefault("HF_HOME", str(HF_CACHE.resolve()))
INDEX_DIR.mkdir(parents=True, exist_ok=True)
HF_CACHE.mkdir(parents=True, exist_ok=True)

device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained(MODEL_ID).to(device).eval()
proc  = CLIPProcessor.from_pretrained(MODEL_ID, use_fast=USE_FAST)

# =========================
# IO
# =========================
def load_meta_entries() -> List[dict]:
    if not CROP_META_PATH.exists():
        raise FileNotFoundError(
            f"Não encontrei {CROP_META_PATH}. Rode antes scripts/detect_and_crop.py"
        )
    with open(CROP_META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    # mantém apenas registros com crop existente
    kept = []
    for m in meta:
        crop = m.get("crop")
        if not crop:
            continue
        if not Path(crop).exists():
            continue

        # normaliza e, quando possível, relativiza
        m["crop"] = as_posix_rel(crop)

        # src (se presente) também fica padronizado
        if isinstance(m.get("src"), str):
            m["src"] = as_posix_rel(m["src"])

        kept.append(m)

    return kept

def load_existing_index() -> Tuple[faiss.Index | None, List[dict]]:
    if INDEX_PATH.exists() and META_PATH.exists():
        index = faiss.read_index(str(INDEX_PATH))
        with open(META_PATH, "r", encoding="utf-8") as f:
            rows = json.load(f)
        return index, rows
    return None, []

def save_index_atomic(index: faiss.Index, path: Path):
    tmp = path.with_suffix(".faiss.tmp")
    faiss.write_index(index, str(tmp))
    os.replace(tmp, path)

def save_meta_atomic(rows: List[dict], path: Path):
    tmp = path.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)

# =========================
# Embedding em batch
# =========================
def embed_batch(imgs: List[Image.Image]) -> np.ndarray:
    inputs = proc(images=[im.convert("RGB") for im in imgs],
                  return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        e = model.get_image_features(**inputs)
    e = torch.nn.functional.normalize(e, dim=-1)
    return e.cpu().numpy().astype("float32")

# =========================
# Main
# =========================
def main():
    # 1) lista total de crops (padronizada)
    all_meta = load_meta_entries()

    # 2) retomar se já existir
    index, rows = load_existing_index()
    start_at = len(rows)
    if index is None:
        print("Iniciando índice do zero.")
    else:
        print(f"Retomando: já havia {start_at} imagens no índice.")

    # 3) o que falta
    todo = all_meta[start_at:]
    total = len(all_meta)
    remaining = len(todo)
    if remaining == 0:
        print("Nada a indexar — já está tudo atualizado.")
        return

    # estado explícito
    state = {
        "index": index,
        "rows": rows,
        "processed_since_ckpt": 0,
    }

    batch_paths: List[Path] = []
    batch_entries: List[dict] = []

    def flush_batch():
        if not batch_paths:
            return

        # carregar imagens (PIL) + pré-calcular HSV para o meta
        images: List[Image.Image] = []
        hsv_hists: List[np.ndarray] = []
        for p in batch_paths:
            try:
                img = Image.open(p).convert("RGB")
                images.append(img)
                bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                hsv_hists.append(color_hist_hsv(bgr))
            except Exception:
                # placeholder seguro
                images.append(Image.new("RGB", (64, 64), (0, 0, 0)))
                hsv_hists.append(np.zeros(64, dtype="float32"))

        X = embed_batch(images)  # [B, D]

        # cria índice no primeiro flush
        if state["index"] is None:
            state["index"] = faiss.IndexFlatIP(X.shape[1])  # cosseno (norm.)

        state["index"].add(X)

        # anexa entradas ao meta (com hsv_hist)
        for m, hh in zip(batch_entries, hsv_hists):
            m["hsv_hist"] = [float(x) for x in hh.tolist()]
            # garante POSIX para segurança
            m["crop"] = Path(m["crop"]).as_posix()
            if isinstance(m.get("src"), str):
                m["src"] = Path(m["src"]).as_posix()
        state["rows"].extend(batch_entries)

        state["processed_since_ckpt"] += len(batch_paths)

        # checkpoint
        if state["processed_since_ckpt"] >= CHECKPOINT_EVERY:
            save_index_atomic(state["index"], INDEX_PATH)
            save_meta_atomic(state["rows"], META_PATH)
            state["processed_since_ckpt"] = 0

        batch_paths.clear()
        batch_entries.clear()

    # 4) loop com barra e batch
    pbar = tqdm(todo, desc="Indexando (embeddings + hsv)", unit="img")
    for m in pbar:
        crop_rel = m["crop"]                     # já está POSIX/relativizado
        crop_path = (PROJECT_ROOT / crop_rel) if not Path(crop_rel).is_absolute() else Path(crop_rel)
        batch_paths.append(crop_path)
        batch_entries.append(m)
        if len(batch_paths) >= BATCH_SIZE:
            flush_batch()

    # flush final + salvar
    flush_batch()
    save_index_atomic(state["index"], INDEX_PATH)
    save_meta_atomic(state["rows"], META_PATH)

    print(f"OK: {len(state['rows'])}/{total} imagens indexadas → {INDEX_PATH} | meta: {META_PATH}")

if __name__ == "__main__":
    main()
