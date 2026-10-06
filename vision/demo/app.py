# demo/app.py
import os
import io
import base64
import time
from typing import Any, Dict, List, Tuple

import requests
import pandas as pd
from PIL import Image, ImageOps
import streamlit as st

# -------------------------------
# Config
# -------------------------------
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")
PAGE_TITLE = "PataNet - Localizador (Demo)"
st.set_page_config(page_title=PAGE_TITLE, layout="wide")

# -------------------------------
# Helpers
# -------------------------------
def _pct(x: float) -> float:
    try:
        return max(0.0, min(100.0, float(x) * 100.0)) if x <= 1.0 else float(x)
    except Exception:
        return 0.0

def _fmt_pct(x: float) -> str:
    return f"{_pct(x):.1f}%"

def _img_to_bytes(img: Image.Image, fmt="JPEG", quality=90) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt, quality=quality)
    return buf.getvalue()

def _read_image(file) -> Image.Image:
    img = Image.open(file).convert("RGB")
    # normaliza orientação EXIF
    img = ImageOps.exif_transpose(img)
    return img

def _grid(items: List[Dict[str, Any]], cols: int = 5):
    """Renderiza uma grade flexível com Streamlit columns."""
    if not items:
        return
    rows = (len(items) + cols - 1) // cols
    idx = 0
    for _ in range(rows):
        cs = st.columns(cols, gap="large")
        for c in cs:
            if idx >= len(items):
                break
            with c:
                items[idx]()
            idx += 1

def _download_button_csv(df: pd.DataFrame, filename: str, label: str = "Baixar CSV"):
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    st.download_button(label=label, data=csv_bytes, file_name=filename, mime="text/csv")

def call_search(
    api_url: str,
    image_bytes: bytes,
    filename: str,
    params: Dict[str, Any],
    timeout: int = 60,
) -> Dict[str, Any]:
    files = {"file": (filename, image_bytes, "image/jpeg")}
    data = {k: str(v) for k, v in params.items()}
    r = requests.post(f"{api_url}/search", files=files, data=data, timeout=timeout)
    r.raise_for_status()
    return r.json()

# -------------------------------
# Sidebar
# -------------------------------
st.title(PAGE_TITLE)
st.caption("Envie uma imagem e ajuste os parâmetros para inspecionar os resultados e diagnósticos.")

with st.sidebar:
    st.header("Parâmetros")
    api_url = st.text_input("API URL", API_URL)

    k = st.slider("Top-K (resultados)", min_value=1, max_value=30, value=10, step=1)
    st.markdown("---")

    use_head = st.checkbox("Usar embedding de 'head' (rosto/cab.),", value=True)
    use_color = st.checkbox("Usar features de cor", value=True)

    w_krec = st.slider("Peso k-reciprocal (w_krec)", 0.0, 1.0, 0.6, 0.05)
    w_head = st.slider("Peso head (w_head)", 0.0, 1.0, 0.25, 0.05)
    w_color = st.slider("Peso color (w_color)", 0.0, 1.0, 0.15, 0.05)
    st.caption("Dica: mantenha w_krec como principal, head e color como complementares.")

    k1 = st.select_slider("k1 (k-reciprocal)", options=[8, 12, 20, 30, 40], value=20)
    k2 = st.select_slider("k2 (k-reciprocal)", options=[2, 4, 6, 8, 10], value=6)
    lam = st.select_slider("λ (k-reciprocal)", options=[0.1, 0.2, 0.3, 0.4, 0.5], value=0.3)

    st.markdown("---")
    species_filter = st.selectbox("Filtrar espécie", ["auto", "dog", "cat"], index=0)
    min_breed_conf = st.slider("Confiança mínima p/ raça", 0.0, 1.0, 0.30, 0.05)
    topk_breeds = st.slider("Raças no resumo", 1, 5, 3, 1)

    st.markdown("---")
    return_diag = st.checkbox("Incluir diagnóstico detalhado", value=True)
    timeout = st.number_input("Timeout (segundos)", min_value=10, max_value=180, value=60, step=5)

# -------------------------------
# Upload
# -------------------------------
st.subheader("Envie uma imagem com um animal")
uploaded = st.file_uploader("Arraste e solte aqui (JPG/PNG)", type=["jpg", "jpeg", "png"])

# -------------------------------
# Execução
# -------------------------------
if uploaded:
    try:
        img = _read_image(uploaded)
    except Exception as e:
        st.error(f"Falha ao abrir imagem: {e}")
        st.stop()
        
    st.image(img, caption="Consulta", width='content')

    # monta parâmetros da API
    params = dict(
        k=k,
        use_head=int(use_head),
        use_color=int(use_color),
        w_krec=w_krec,
        w_head=w_head,
        w_color=w_color,
        krec_k1=k1,
        krec_k2=k2,
        krec_lambda=lam,
        species_filter=species_filter,
        min_breed_conf=min_breed_conf,
        topk_breeds=topk_breeds,
        return_diagnostics=int(return_diag),
    )

    with st.spinner("Consultando a API..."):
        t0 = time.time()
        try:
            resp = call_search(api_url, _img_to_bytes(img), uploaded.name, params, timeout=timeout)
        except requests.HTTPError as e:
            st.error(f"HTTPError: {e}\nResposta: {getattr(e.response, 'text', '')[:500]}")
            st.stop()
        except Exception as e:
            st.error(f"Erro ao chamar API: {e}")
            st.stop()
        t_ms = (time.time() - t0) * 1000.0

    # ---------------------------
    # Cabeçalho / Metadados
    # ---------------------------
    colA, colB, colC = st.columns([1, 1, 1])
    with colA:
        st.metric("Latência", f"{t_ms:.1f} ms")
        if "latency_ms" in resp:
            st.caption(f"Latency (API): {resp['latency_ms']:.1f} ms")

    with colB:
        species = resp.get("species", resp.get("species_pred"))
        sconf = resp.get("species_conf")
        if species:
            st.metric("Espécie", f"{species}", (_fmt_pct(sconf) if sconf is not None else None))

    with colC:
        st.metric("Top-K usado", f"{resp.get('k', k)}")
        flags = resp.get("flags", {})
        st.caption(f"Flags: head={flags.get('use_head')}, color={flags.get('use_color')}")

    # ---------------------------
    # Raças (top-3 ou top-N)
    # ---------------------------
    st.subheader("Raças prováveis")
    breed_list = resp.get("breed_top3") or []
    if not breed_list:
        st.warning("Sem raças com confiança acima do limiar configurado.")
    else:
        df_breeds = pd.DataFrame(
            [{"raça": b.get("label"), "confiança(%)": _pct(b.get("prob", 0.0))} for b in breed_list]
        )
        st.dataframe(df_breeds, width='stretch')
        for b in breed_list:
            st.progress(min(1.0, float(b.get("prob", 0.0))), text=f"{b.get('label')} – {_fmt_pct(b.get('prob', 0.0))}")

    # ---------------------------
    # Atributos (visão clássica)
    # ---------------------------
    attrs = resp.get("attributes", {})
    if attrs:
        st.subheader("Atributos (clássico)")
        cols = st.columns(3)
        for i, (kattr, v) in enumerate(attrs.items()):
            with cols[i % 3]:
                st.write(f"**{kattr}**: {v}")

    # ---------------------------
    # Explicação (texto amigável)
    # ---------------------------
    if resp.get("explanation"):
        st.info(resp["explanation"])

    # ---------------------------
    # Top-K resultados (galeria)
    # ---------------------------
    st.subheader("Top-K")
    topk = resp.get("topk", [])
    if not topk:
        st.warning("Nenhum vizinho retornado pela galeria.")
    else:
        def render_card(item: Dict[str, Any]):
            def _render():
                # legenda
                score = float(item.get("score", 0.0))
                head = float(item.get("score_head", 0.0))
                color = float(item.get("score_color", 0.0))
                krec = float(item.get("score_krecip", 0.0))
                label = item.get("label") or item.get("cls")  # se existir
                src = item.get("src") or item.get("crop")
                cap = f"score={score:.3f} | krec={krec:.3f} | head={head:.3f} | color={color:.3f}"

                # tenta exibir crop preferencialmente
                img_path = item.get("crop") or item.get("src")
                if img_path and os.path.exists(img_path):
                    try:
                        im = Image.open(img_path).convert("RGB")
                        st.image(im, width='stretch')
                    except Exception:
                        st.write(f"Imagem: {img_path}")
                else:
                    st.write(f"Imagem: {src or '—'}")

                st.caption(cap)
                sp = item.get("species_pred")
                sc = item.get("species_conf")
                if sp:
                    st.caption(f"espécie={sp} ({_fmt_pct(sc) if sc is not None else '—'})")
                if label and isinstance(label, str):
                    st.caption(f"rótulo: {label}")
            return _render

        _grid([render_card(x) for x in topk], cols=6)

    # ---------------------------
    # Diagnóstico detalhado
    # ---------------------------
    if return_diag:
        st.subheader("Diagnóstico")
        weights = None
        if topk:
            weights = topk[0].get("weights")
        if weights:
            st.write("**Pesos usados:**", weights)
        st.write("**k-reciprocal:**", dict(k1=params["krec_k1"], k2=params["krec_k2"], lam=params["krec_lambda"]))

        # monta DataFrame com métricas por item
        rows = []
        for it in topk:
            rows.append(
                dict(
                    src=it.get("src"),
                    crop=it.get("crop"),
                    score=float(it.get("score", 0.0)),
                    krec=float(it.get("score_krecip", 0.0)),
                    head=float(it.get("score_head", 0.0)),
                    color=float(it.get("score_color", 0.0)),
                    species=it.get("species_pred"),
                    species_conf=_pct(it.get("species_conf", 0.0)),
                )
            )
        df_diag = pd.DataFrame(rows)
        st.dataframe(df_diag, width='stretch')
        _download_button_csv(df_diag, "diagnostico_topk.csv", "Baixar CSV (Top-K)")

    # ---------------------------
    # Export da resposta bruta
    # ---------------------------
    if st.checkbox("Mostrar JSON bruto"):
        st.json(resp)

else:
    st.caption("Dica: você pode definir a variável de ambiente `API_URL` antes de rodar o Streamlit.")
    st.code('API_URL="http://127.0.0.1:8000" streamlit run demo/app.py', language="bash")
