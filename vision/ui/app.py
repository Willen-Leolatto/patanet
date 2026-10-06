import os
import json
import time
from io import BytesIO
from pathlib import Path
from glob import glob

import numpy as np
import requests
import streamlit as st
from PIL import Image, ImageOps
import cv2

st.set_page_config(page_title="PataNet Vision • Visual", layout="wide")

API_URL = os.getenv("PATANET_API_URL", "http://127.0.0.1:8000")

# =========================
# Utils (client-side CV)
# =========================
def pil_to_bgr(pil: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(pil.convert("RGB")), cv2.COLOR_RGB2BGR)

def bgr_to_pil(bgr: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))

def letterbox_pil(pil: Image.Image, target_min_edge=512, border=16) -> Image.Image:
    w, h = pil.size
    scale = target_min_edge / min(w, h)
    if scale < 1.0:
        return ImageOps.expand(pil, border=border, fill=(0, 0, 0))
    nw, nh = int(round(w * scale)), int(round(h * scale))
    resized = pil.resize((nw, nh), Image.BICUBIC)
    return ImageOps.expand(resized, border=border, fill=(0, 0, 0))

def hsv_map(bgr: np.ndarray):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h,s,v = cv2.split(hsv)
    return h, s, v

def canny_edges(bgr: np.ndarray, low=100, high=200):
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, low, high)
    vis = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    vis[edges>0] = (30,200,255)
    over = cv2.addWeighted(bgr, 0.8, vis, 0.8, 0)
    return over

def kmeans_quantize(bgr: np.ndarray, k=6):
    Z = bgr.reshape((-1,3)).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(Z, k, None, criteria, 10, cv2.KMEANS_PP_CENTERS)
    centers = np.uint8(centers)
    quant = centers[labels.flatten()].reshape(bgr.shape)
    return quant, centers

def simple_regions(bgr: np.ndarray):
    """Regiões simples dentro da imagem (face/peito/dorso em termos de faixas)."""
    H, W = bgr.shape[:2]
    head  = bgr[:int(0.45*H), int(0.15*W):int(0.85*W)]
    chest = bgr[int(0.55*H):int(0.85*H), int(0.25*W):int(0.75*W)]
    back  = bgr[:int(0.45*H), int(0.20*W):int(0.80*W)]
    return head, chest, back

def region_stats_hsv(bgr: np.ndarray):
    if bgr is None or bgr.size == 0:
        return {}
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lap = cv2.Laplacian(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY), cv2.CV_64F)
    return {
        "h_mean": float(hsv[...,0].mean()),
        "s_mean": float(hsv[...,1].mean()),
        "v_mean": float(hsv[...,2].mean()),
        "lap_var": float(lap.var()),
    }

def pct01(x): 
    try:
        return round(100*float(x),1)
    except Exception:
        return 0.0

def find_local_samples(max_per_class=12):
    """
    Varre algumas amostras locais (se existirem) para teste rápido na UI.
    Retorna lista de caminhos.
    """
    paths = []
    # Stanford Dogs
    sd = Path("data/stanford_dogs/Images")
    if sd.exists():
        # Algumas classes populares
        patterns = [
            "n02099601-golden_retriever/*.jpg",
            "n02106166-Border_collie/*.jpg",
            "n02108551-Tibetan_mastiff/*.jpg",
            "n02099712-Labrador_retriever/*.jpg",
        ]
        for pat in patterns:
            sub = sorted(glob(str(sd / pat)))[:max_per_class]
            paths.extend(sub)
    # Oxford Pets
    op = Path("data/oxford_pets/images")
    if op.exists():
        patterns = [
            "saint_bernard_*.jpg",
            "great_pyrenees_*.jpg",
            "ragdoll_*.jpg",
            "siamese_*.jpg",
        ]
        for pat in patterns:
            sub = sorted(glob(str(op / pat)))[:max_per_class]
            paths.extend(sub)

    return paths[:64]

# =========================
# UI
# =========================
st.title("🐾 PataNet Vision — Modo Visual")

with st.sidebar:
    st.header("Configuração da API")
    api_url = st.text_input("API URL", API_URL, help="Ex.: http://127.0.0.1:8000")
    st.caption("Suba a API em outra janela:\n`uvicorn app.main:app --reload --port 8000`")

    st.markdown("---")
    st.subheader("Amostras locais")
    samples = find_local_samples()
    if samples:
        pick = st.selectbox("Escolha uma amostra local", options=["(nenhuma)"] + samples, index=0)
        st.caption("Dica: amostras vêm de `data/stanford_dogs/Images` e `data/oxford_pets/images`.")
    else:
        pick = "(nenhuma)"
        st.caption("Nenhuma amostra encontrada nas pastas padrão.")

tab_search, tab_analyze, tab_eval = st.tabs(["🔎 Busca", "🧭 Analisar Imagem", "📊 Validação (Eval)"])

# -------------------------
# TAB 1 — Busca
# -------------------------
with tab_search:
    st.subheader("Busca Visual")
    colU, colS = st.columns([1,1], gap="large")

    with colU:
        up = st.file_uploader("Envie uma imagem (JPG/PNG)", type=["jpg","jpeg","png","webp"], key="search_up")
        if pick != "(nenhuma)" and not up:
            # carrega amostra local
            try:
                img = Image.open(pick).convert("RGB")
                st.image(img, caption=f"Amostra: {Path(pick).name}", width='stretch')
                up_bytes = BytesIO()
                img.save(up_bytes, format="PNG")
                up_bytes.seek(0)
                fake_up = {"name": Path(pick).name, "bytes": up_bytes.getvalue()}
            except Exception:
                fake_up = None
        else:
            fake_up = None
            if up:
                st.image(Image.open(up).convert("RGB"), caption=up.name, width='stretch')

    with st.expander("Parâmetros de busca"):
        k = st.number_input("k (Top resultados)", 1, 20, 5, 1)
        use_head = st.checkbox("Usar similaridade de cabeça", True)
        use_color = st.checkbox("Usar similaridade de cor (HSV)", True)
        st.markdown("**Pesos** (somados e normalizados no servidor)")
        w_krec = st.slider("Peso base (k-reciprocal/cosseno)", 0.0, 1.0, 0.60, 0.01)
        w_head = st.slider("Peso head", 0.0, 1.0, 0.25, 0.01)
        w_color= st.slider("Peso cor", 0.0, 1.0, 0.15, 0.01)
        st.markdown("**Hiperparâmetros k-reciprocal**")
        krec_k1 = st.slider("k1", 5, 60, 20, 1)
        krec_k2 = st.slider("k2", 0, 20, 6, 1)
        krec_lambda = st.slider("lambda", 0.0, 1.0, 0.30, 0.01)
        return_diag = st.checkbox("Retornar diagnósticos de tempo", True)

    if up or fake_up:
        with st.spinner("Consultando /search ..."):
            if fake_up:
                files = {"file": (fake_up["name"], fake_up["bytes"], "application/octet-stream")}
            else:
                files = {"file": (up.name, up.getvalue(), "application/octet-stream")}
            data = {
                "k": str(k),
                "use_head": str(int(use_head)),
                "use_color": str(int(use_color)),
                "w_krec": str(w_krec), "w_head": str(w_head), "w_color": str(w_color),
                "krec_k1": str(krec_k1), "krec_k2": str(krec_k2), "krec_lambda": str(krec_lambda),
                "return_diagnostics": str(int(return_diag)),
            }
            try:
                r = requests.post(f"{api_url}/search", files=files, data=data, timeout=180)
                r.raise_for_status()
                resp = r.json()
            except Exception as e:
                st.error(f"Falha ao consultar API: {e}")
                st.stop()

        with colS:
            st.markdown("**Resumo**")
            breed_top3 = resp.get("breed_top3", [])
            if breed_top3:
                st.write(f"Top-1 raça: `{breed_top3[0]['label']}` ({breed_top3[0]['prob']:.2f})")
                if len(breed_top3) > 1:
                    st.caption(f"Outras: {breed_top3[1]['label']} ({breed_top3[1]['prob']:.2f}), "
                               f"{breed_top3[2]['label']} ({breed_top3[2]['prob']:.2f})")
            st.write(f"Latência: **{resp.get('latency_ms',0)} ms**")
            st.write("Qualidade:", "✅ OK" if resp.get("quality_ok") else "⚠️ Ver notas")
            if resp.get("quality_notes"):
                st.write(resp["quality_notes"])

            st.markdown("**Aparência (visão clássica baseada em HSV)**")
            attrs = resp.get("attributes", {})
            if attrs:
                st.write(f"- {attrs.get('coat','n/d')}")
                st.write(f"- Marca no peito: {'sim' if attrs.get('chest_white') else 'não'}")
            if resp.get("explanation"):
                st.caption(resp["explanation"])

        st.subheader("Top-k resultados")
        topk = resp.get("topk", [])
        cols = st.columns(2, gap="large")
        for i, item in enumerate(topk):
            with cols[i % 2]:
                st.markdown(
                    f"**#{i+1}** — score: **{item['score']:.4f}** ({pct01(item['score'])}%)  \n"
                    f"`base` {pct01(item['score_krecip'])}% • `head` {pct01(item['score_head'])}% • `cor` {pct01(item['score_color'])}%  \n"
                    f"pesos: {item['weights']}"
                )
                # render da imagem
                crop_path = item.get("crop")
                src_path  = item.get("src")
                pil = None
                for pth in [crop_path, src_path]:
                    if pth and Path(pth).exists():
                        try:
                            pil = Image.open(pth).convert("RGB")
                            break
                        except Exception:
                            pass
                if pil is not None:
                    st.image(pil, width='stretch')
                else:
                    st.warning("Não consegui abrir o caminho de imagem retornado (ver paths).")
                st.caption(f"crop: `{crop_path}`\nsrc: `{src_path}`")

        with st.expander("Resposta JSON"):
            st.code(json.dumps(resp, ensure_ascii=False, indent=2), language="json")

        # Pré-visualização de filtros clássicos na imagem enviada (amostra)
        with st.expander("Pré-visualizar filtros (visão clássica) na imagem de entrada"):
            if fake_up:
                base_img = Image.open(BytesIO(fake_up["bytes"])).convert("RGB")
            else:
                base_img = Image.open(up).convert("RGB")
            bgr = pil_to_bgr(base_img)
            colF1, colF2 = st.columns(2, gap="large")
            with colF1:
                st.markdown("**Bordas (Canny)**")
                lo = st.slider("Canny low", 0, 255, 80, 1, key="canny_lo_prev")
                hi = st.slider("Canny high", 0, 255, 160, 1, key="canny_hi_prev")
                st.image(bgr_to_pil(canny_edges(bgr, lo, hi)), width='stretch')
            with colF2:
                st.markdown("**Quantização de cor (K-means)**")
                kq = st.slider("K cores", 2, 12, 6, 1, key="kq_prev")
                quant, centers = kmeans_quantize(bgr, kq)
                st.image(bgr_to_pil(quant), width='stretch')

# -------------------------
# TAB 2 — Analisar
# -------------------------
with tab_analyze:
    st.subheader("Analisar imagem por partes")
    up2 = st.file_uploader("Envie uma imagem (JPG/PNG)", type=["jpg","jpeg","png","webp"], key="analyze_up")

    mode = st.radio("Modelo visual", ["Conv/Conexionista (DL via API)", "Clássica (CV local)"])
    col1, col2 = st.columns([1,1], gap="large")

    if up2:
        with col1:
            img = Image.open(up2).convert("RGB")
            st.image(img, caption="Imagem enviada", width='stretch')

        if mode.startswith("Conv"):
            with st.expander("Parâmetros (DL)"):
                conf = st.slider("Confiança YOLO", 0.1, 0.9, 0.35, 0.01)
                with_seg = st.checkbox("Segmentação (máscara)", True)
                return_image = st.checkbox("Salvar e retornar anotada", False)

            with st.spinner("Consultando /analyze ..."):
                files = {"file": (up2.name, up2.getvalue(), "application/octet-stream")}
                params = {"conf": conf, "with_seg": int(with_seg), "return_image": int(return_image)}
                try:
                    r = requests.post(f"{api_url}/analyze", params=params, files=files, timeout=180)
                    r.raise_for_status()
                    aresp = r.json()
                except Exception as e:
                    st.error(f"Falha ao consultar API /analyze: {e}")
                    st.stop()

            with col2:
                st.write(f"Latência: **{aresp.get('latency_ms',0)} ms**")
                st.write(f"Animais detectados: **{aresp.get('num_animals',0)}**")
                if aresp.get("annotated_path"):
                    p = aresp["annotated_path"]
                    st.write("Imagem anotada:")
                    if Path(p).exists():
                        st.image(Image.open(p).convert("RGB"), width='stretch')
                    else:
                        st.caption(p)

            st.markdown("---")
            st.markdown("### Detalhes por animal")
            for i, a in enumerate(aresp.get("animals", []), 1):
                st.markdown(f"**Animal #{i}** — {a['cls_name']} (conf {a['conf']:.2f}) bbox={a['bbox']}")
                cols = st.columns(3)
                regions = a.get("regions", {})
                for (name, stats), c in zip(regions.items(), cols):
                    with c:
                        st.write(f"**{name}**")
                        st.json(stats)

            with st.expander("JSON completo"):
                st.code(json.dumps(aresp, ensure_ascii=False, indent=2), language="json")

        else:
            # Clássica (CV local)
            with st.expander("Parâmetros (CV)"):
                canny_lo = st.slider("Canny low", 0, 255, 80, 1)
                canny_hi = st.slider("Canny high", 0, 255, 160, 1)
                k_colors = st.slider("K (quantização de cor)", 2, 12, 6, 1)

            bgr = pil_to_bgr(img)
            H,S,V = hsv_map(bgr)
            edges = canny_edges(bgr, canny_lo, canny_hi)
            quant, centers = kmeans_quantize(bgr, k_colors)
            head, chest, back = simple_regions(bgr)

            colA, colB = st.columns([1,1], gap="large")
            with colA:
                st.markdown("**Bordas (Canny) sobrepostas**")
                st.image(bgr_to_pil(edges), width='stretch')
                st.markdown("**Quantização de cor (K-means)**")
                st.image(bgr_to_pil(quant), width='stretch')

            with colB:
                st.markdown("**Mapas HSV (tons)**")
                st.image(V, caption="Value (brilho)", clamp=True, width='stretch')
                st.image(S, caption="Saturation", clamp=True, width='stretch')
                st.image(H, caption="Hue", clamp=True, width='stretch')

            st.markdown("---")
            st.markdown("### Regiões (estatísticas HSV + foco)")
            rcols = st.columns(3)
            for name, reg, col in [
                ("head", head, rcols[0]),
                ("chest", chest, rcols[1]),
                ("back", back, rcols[2]),
            ]:
                with col:
                    st.write(f"**{name}**")
                    st.image(bgr_to_pil(reg), width='stretch')
                    st.json(region_stats_hsv(reg))
