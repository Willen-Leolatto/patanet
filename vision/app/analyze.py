# app/analyze.py
# Endpoint /analyze para "ver por partes" a imagem:
# - detecta os animais (YOLOv8n)
# - (opcional) segmenta o animal (YOLOv8n-seg) e retorna os pontos da máscara
# - extrai regiões (whole/head/chest/back) e calcula estatísticas HSV + foco
# - opcionalmente gera uma imagem anotada em outputs/analysis/

from fastapi import APIRouter, UploadFile, File
from typing import List, Optional, Tuple, Dict
from pathlib import Path
import io, time, os

import numpy as np
import cv2
from PIL import Image

# ==============================
# Configs
# ==============================
PET_CLASSES = [15, 16]  # 15=cat, 16=dog
OUT_DIR = Path("outputs/analysis")
OUT_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(tags=["analyze"])

# ==============================
# Lazy-load dos modelos (evita custo na importação)
# ==============================
_YOLO_DET = None
_YOLO_SEG = None

def get_yolo_det():
    global _YOLO_DET
    if _YOLO_DET is None:
        from ultralytics import YOLO
        _YOLO_DET = YOLO("yolov8n.pt")
    return _YOLO_DET

def get_yolo_seg():
    global _YOLO_SEG
    if _YOLO_SEG is None:
        from ultralytics import YOLO
        _YOLO_SEG = YOLO("yolov8n-seg.pt")
    return _YOLO_SEG

# ==============================
# Utilitários
# ==============================
def pil_to_bgr(pil_img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)

def region_stats_hsv(bgr: np.ndarray) -> Dict[str, float]:
    """Estatísticas simples por região: HSV médio + nitidez (var Laplacian)."""
    if bgr is None or bgr.size == 0:
        return {}
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lap = cv2.Laplacian(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY), cv2.CV_64F)
    return {
        "h_mean": float(hsv[..., 0].mean()),
        "s_mean": float(hsv[..., 1].mean()),
        "v_mean": float(hsv[..., 2].mean()),
        "lap_var": float(lap.var()),
    }

# Haar de gato (se existir localmente); usamos como “pista” p/ cabeça
_haar_cat = None
_haar_path = cv2.data.haarcascades + "haarcascade_frontalcatface.xml"
if os.path.exists(_haar_path):
    _haar_cat = cv2.CascadeClassifier(_haar_path)

def extract_head_crop_from_bgr(bgr: np.ndarray) -> np.ndarray:
    """Corta a cabeça por heurística leve (Haar de gato ou faixa superior central)."""
    h, w = bgr.shape[:2]
    if _haar_cat is not None:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        faces = _haar_cat.detectMultiScale(gray, 1.1, 3)
        if len(faces):
            x, y, ww, hh = max(faces, key=lambda r: r[2]*r[3])
            pad = int(0.15 * max(ww, hh))
            x1 = max(0, x - pad); y1 = max(0, y - pad)
            x2 = min(w, x + ww + pad); y2 = min(h, y + hh + pad)
            crop = bgr[y1:y2, x1:x2]
            if crop.size > 0:
                return crop
    # fallback: parte superior central (serve bem p/ cães também)
    y2 = int(0.55 * h); x1 = int(0.15 * w); x2 = int(0.85 * w)
    crop = bgr[:y2, x1:x2]
    return crop if crop.size else bgr

def choose_best_mask_for_bbox(masks_xy: List[np.ndarray], box_xyxy: Tuple[int,int,int,int]) -> Optional[np.ndarray]:
    """Escolhe a máscara com maior IoU com a bbox."""
    if not masks_xy:
        return None
    x1, y1, x2, y2 = box_xyxy
    best, best_iou = None, 0.0
    areaB = (x2 - x1) * (y2 - y1)
    for m in masks_xy:
        m = m.astype(int)
        mx1, my1 = m[:, 0].min(), m[:, 1].min()
        mx2, my2 = m[:, 0].max(), m[:, 1].max()
        ix1, iy1 = max(x1, mx1), max(y1, my1)
        ix2, iy2 = min(x2, mx2), min(y2, my2)
        inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
        areaM = (mx2 - mx1) * (my2 - my1)
        union = areaB + areaM - inter + 1e-6
        iou = inter / union
        if iou > best_iou:
            best_iou, best = iou, m
    return best

def draw_overlay(bgr: np.ndarray, detections: List[dict], out_path: Path) -> str:
    """Desenha caixas/máscaras e salva imagem anotada."""
    img = bgr.copy()
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        cv2.rectangle(img, (x1, y1), (x2, y2), (30, 200, 255), 2)
        label = f"{det['cls_name']} {det['conf']:.2f}"
        cv2.putText(img, label, (x1, max(0, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (30, 200, 255), 1, cv2.LINE_AA)
        pts = det.get("mask_points")
        if isinstance(pts, list) and len(pts) >= 3:
            poly = np.array(pts, dtype=np.int32)
            cv2.polylines(img, [poly], isClosed=True, color=(60, 255, 60), thickness=2)
            cv2.fillPoly(img, [poly], color=(60, 255, 60, 40))
    cv2.imwrite(str(out_path), img)
    return out_path.as_posix()

# ==============================
# Endpoint
# ==============================
@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    conf: float = 0.35,
    with_seg: int = 1,
    return_image: int = 0,
):
    """
    Analisa uma imagem:
      - detecta pets (bbox + conf + classe)
      - (opcional) segmenta e retorna polígono da máscara
      - retorna estatísticas HSV por regiões: whole/head/chest/back
      - opcionalmente salva e retorna caminho de uma imagem anotada
    """
    t0 = time.perf_counter()
    raw = await file.read()
    pil = Image.open(io.BytesIO(raw)).convert("RGB")
    bgr = pil_to_bgr(pil)

    # 1) detecção
    det_model = get_yolo_det()
    det_res = det_model.predict(bgr, classes=PET_CLASSES, conf=conf, verbose=False)[0]

    # 2) segmentação opcional
    seg_masks_xy = []
    if int(with_seg) == 1:
        try:
            seg_model = get_yolo_seg()
            seg_res = seg_model.predict(bgr, classes=PET_CLASSES, conf=conf, verbose=False)[0]
            if seg_res.masks is not None and len(seg_res.masks.xy):
                seg_masks_xy = [np.array(m) for m in seg_res.masks.xy]  # lista de polígonos (N x 2)
        except Exception:
            seg_masks_xy = []

    animals = []
    for box in det_res.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        cls_id = int(box.cls.item())
        conf_v = float(box.conf.item())
        crop = bgr[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        # regiões dentro do crop
        H, W = crop.shape[:2]
        head = extract_head_crop_from_bgr(crop)
        chest = crop[int(0.55 * H):int(0.85 * H), int(0.25 * W):int(0.75 * W)]
        back  = crop[:int(0.45 * H), int(0.20 * W):int(0.80 * W)]

        # máscara que melhor casa com a bbox
        mask_pts = None
        if seg_masks_xy:
            best = choose_best_mask_for_bbox(seg_masks_xy, (x1, y1, x2, y2))
            if best is not None:
                # reduz ponto para não explodir JSON
                if best.shape[0] > 300:
                    step = best.shape[0] // 300
                    best = best[::max(1, step)]
                mask_pts = best.astype(int).tolist()

        animals.append({
            "bbox": [x1, y1, x2, y2],
            "cls_id": cls_id,
            "cls_name": "cat" if cls_id == 15 else ("dog" if cls_id == 16 else str(cls_id)),
            "conf": conf_v,
            "regions": {
                "whole": region_stats_hsv(crop),
                "head":  region_stats_hsv(head) if head is not None and head.size else {},
                "chest": region_stats_hsv(chest) if chest is not None and chest.size else {},
                "back":  region_stats_hsv(back)  if back  is not None and back.size  else {},
            },
            "mask_points": mask_pts,  # lista [[x,y], ...] ou None
        })

    annotated_path = None
    if int(return_image) == 1:
        out_path = OUT_DIR / f"analyze_{int(time.time())}.jpg"
        annotated_path = draw_overlay(bgr, animals, out_path)

    latency_ms = (time.perf_counter() - t0) * 1000.0
    return {
        "ok": True,
        "latency_ms": round(latency_ms, 1),
        "num_animals": len(animals),
        "animals": animals,
        "annotated_path": annotated_path,
    }
