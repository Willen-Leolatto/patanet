# scripts/fit_pca_gallery.py
import faiss, json, joblib, numpy as np
from pathlib import Path
from sklearn.decomposition import PCA

INDEX_DIR = Path("index")
SRC_INDEX = INDEX_DIR / "pets.faiss"          # index atual (sem PCA)
SRC_META  = INDEX_DIR / "pets_meta.json"
DST_INDEX = INDEX_DIR / "pets_pca.faiss"      # novo index (com PCA)
PCA_PATH  = Path("models/gallery_pca.joblib") # PCA para a busca

DST_INDEX.parent.mkdir(parents=True, exist_ok=True)
PCA_PATH.parent.mkdir(parents=True, exist_ok=True)

print(f"[PCA] carregando index: {SRC_INDEX}")
index = faiss.read_index(str(SRC_INDEX))
ntotal = index.ntotal
D = index.d
print(f"[PCA] ntotal={ntotal} D={D}")

print("[PCA] reconstruindo todos os vetores...")
X = index.reconstruct_n(0, ntotal).astype("float32")

# Ajuste a dimensionalidade alvo
D_OUT = 256 if D > 256 else D
print(f"[PCA] ajustando PCA para D_OUT={D_OUT}")
pca = PCA(n_components=D_OUT, whiten=True, random_state=42)
Z = pca.fit_transform(X).astype("float32")

print("[PCA] salvando PCA...")
joblib.dump(pca, PCA_PATH)

print("[PCA] criando novo índice FAISS (L2) com vetores PCA...")
faiss_idx = faiss.IndexFlatL2(D_OUT)
faiss_idx.add(Z)
faiss.write_index(faiss_idx, str(DST_INDEX))
print("[PCA] ok:", DST_INDEX)

# apenas revalida meta (não muda)
if SRC_META.exists():
    print("[PCA] meta preservada:", SRC_META)
else:
    print("[PCA] WARN: meta não encontrado (ok se você não usa o arquivo diretamente)")

print("[PCA] pronto.")
