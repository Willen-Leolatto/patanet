# scripts/train_linear_probe.py
import os, json, re, argparse, joblib
from pathlib import Path
from typing import List, Tuple
import numpy as np
from PIL import Image
from tqdm import tqdm

import torch
from transformers import CLIPModel, CLIPProcessor

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, top_k_accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA

# ----------------- Config -----------------
MODEL_ID = "openai/clip-vit-base-patch32"
USE_FAST = True
META_PATH = Path("outputs/crops_meta.json")
OUT_DIR = Path("models")
OUT_DIR.mkdir(parents=True, exist_ok=True)
SEED = 42

# ----------------- Utils ------------------
def infer_label_from_src(src: str) -> str:
    """
    Inferir rótulo a partir do caminho.
    - Stanford Dogs: .../Images/n02099601-golden_retriever/xxx.jpg -> 'golden_retriever'
                      .../n02099267-flat-coated_retriever/xxx.jpg -> 'flat_coated_retriever'
                      .../n02092339-weimaraner/xxx.jpg -> 'weimaraner'
    - Oxford-IIIT:   saint_bernard_123.jpg -> 'saint_bernard'
    """
    p = Path(src)
    # Stanford Dogs: diretório 'n02...-nome_com_hifens_e_underscores'
    for part in p.parts:
        if "-" in part and part.split("-")[0].lower().startswith("n02"):
            # pega TUDO após o primeiro hífen e normaliza hifens para underscores
            after = part.split("-", 1)[1]
            return after.replace("-", "_").lower()
    # Oxford-IIIT: remover o sufixo numérico após o último '_'
    stem = p.stem.lower()
    if "_" in stem:
        return "_".join(stem.split("_")[:-1]) or stem
    return stem

def load_meta(meta_path: Path) -> List[dict]:
    if not meta_path.exists():
        raise FileNotFoundError(f"Não encontrei {meta_path}. Rode detect_and_crop.py antes.")
    return json.loads(meta_path.read_text(encoding="utf-8"))

def build_embeddings(meta: List[dict], limit: int | None) -> tuple[np.ndarray, np.ndarray, list[str]]:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = CLIPModel.from_pretrained(MODEL_ID).to(device).eval()
    proc  = CLIPProcessor.from_pretrained(MODEL_ID, use_fast=USE_FAST)

    def embed(path: str) -> np.ndarray:
        img = Image.open(path).convert("RGB")
        inp = proc(images=img, return_tensors="pt").to(device)
        with torch.no_grad():
            e = model.get_image_features(**inp)
        e = torch.nn.functional.normalize(e, dim=-1)
        return e.squeeze(0).cpu().numpy().astype("float32")

    X, y, labels, lab2id = [], [], [], {}
    it = meta if limit is None else meta[:limit]
    for m in tqdm(it, desc="Embedding (crops)"):
        crop, src = m.get("crop"), m.get("src")
        if not crop or not os.path.exists(crop) or not src:
            continue
        lab = infer_label_from_src(src)
        if lab not in lab2id:
            lab2id[lab] = len(lab2id); labels.append(lab)
        try:
            X.append(embed(crop)); y.append(lab2id[lab])
        except Exception:
            continue

    X = np.array(X, dtype="float32")
    y = np.array(y, dtype="int64")
    return X, y, labels

def main():
    ap = argparse.ArgumentParser("Treina classificador linear (raça/família) sobre CLIP.")
    ap.add_argument("--test_size", type=float, default=0.2)
    ap.add_argument("--limit", type=int, default=None, help="Usar apenas os N primeiros exemplos (sanity check).")
    ap.add_argument("--pca", type=int, default=0, help="Se >0, aplica PCA para essa dimensão (ex.: 256).")
    ap.add_argument("--C", type=float, default=1.0, help="C da logística (regularização).")
    ap.add_argument("--max_iter", type=int, default=1000)
    ap.add_argument("--tol", type=float, default=1e-4)
    args = ap.parse_args()

    meta = load_meta(META_PATH)
    X, y, labels = build_embeddings(meta, limit=args.limit)

    # PCA opcional para acelerar treino (mantém vetores normalizados depois)
    if args.pca and args.pca > 0 and args.pca < X.shape[1]:
        print(f"[PCA] reduzindo de {X.shape[1]} -> {args.pca}")
        pca = PCA(n_components=args.pca, svd_solver="randomized", random_state=SEED)
        X = pca.fit_transform(X).astype("float32")
        joblib.dump(pca, OUT_DIR / "breed_pca.joblib")
    else:
        pca = None

    strat = y if len(set(y)) > 1 else None
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=args.test_size, random_state=SEED, stratify=strat)

    # Logistic Regression acelerada e verbosa:
    # - solver "saga" (suporta multinomial, L2, paralelismo)
    # - multi_class "multinomial" (silencia o FutureWarning)
    # - n_jobs=-1 (usa todos os núcleos)
    clf = LogisticRegression(
        solver="saga",
        multi_class="multinomial",
        penalty="l2",
        C=args.C,
        max_iter=args.max_iter,
        tol=args.tol,
        class_weight="balanced",
        n_jobs=-1,
        verbose=1,
        random_state=SEED,
    )

    print("[train] iniciando treinamento...")
    clf.fit(Xtr, ytr)
    print("[train] concluído.")

    # Avaliação
    ypred = clf.predict(Xte)
    print(classification_report(yte, ypred, target_names=labels, zero_division=0))
    if hasattr(clf, "predict_proba"):
        proba = clf.predict_proba(Xte)
        top3 = top_k_accuracy_score(yte, proba, k=3, labels=list(range(len(labels))))
        print(f"Top-3 acc: {top3:.3f}")

    # Salvar modelo + labels (+ PCA se houver)
    joblib.dump(clf, OUT_DIR / "breed_clf.joblib")
    (OUT_DIR / "breed_labels.json").write_text(json.dumps(labels, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Modelo salvo em {OUT_DIR/'breed_clf.joblib'} com {len(labels)} classes.")
    if pca is None:
        print("Sem PCA (usando dim original do CLIP).")
    else:
        print(f"PCA salvo em {OUT_DIR/'breed_pca.joblib'}.")

if __name__ == "__main__":
    main()
