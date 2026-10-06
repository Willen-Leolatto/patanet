"""Head Invariance: embedding estrutural da cabeça (CLIP) + filtragem HSV."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np

from app.core.config import Settings, get_settings
from app.models.schemas import HeadFeatures, HsvFindings


class HeadFeatureExtractor:
    """Extrai um embedding 512D invariante a pose/iluminação via CLIP ViT-B/32.

    O modelo CLIP é carregado sob demanda para permitir importar este módulo
    sem `torch`/`open_clip` instalados (ex.: testes com dublês de teste).
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._model: Any | None = None
        self._preprocess: Any | None = None

    def _load_model(self) -> tuple[Any, Any]:
        if self._model is None:
            import open_clip  # import pesado, carregado sob demanda

            model, _, preprocess = open_clip.create_model_and_transforms(
                self._settings.clip_model_name,
                pretrained=self._settings.clip_pretrained,
            )
            model.eval()
            self._model = model
            self._preprocess = preprocess
        return self._model, self._preprocess

    def extract(self, head_crop_bgr: np.ndarray) -> HeadFeatures:
        import cv2
        import torch
        from PIL import Image

        model, preprocess = self._load_model()

        rgb = cv2.cvtColor(head_crop_bgr, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb)
        tensor = preprocess(pil_image).unsqueeze(0)

        with torch.no_grad():
            embedding = model.encode_image(tensor)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)

        vector = embedding.squeeze(0).cpu().numpy().astype(float).tolist()
        return HeadFeatures(
            embedding=vector,
            model_name=f"{self._settings.clip_model_name}/{self._settings.clip_pretrained}",
            dim=self._settings.clip_embedding_dim,
        )


class HsvConditionFilter:
    """Detecta lama e sangue na região anatômica recortada via limiares HSV."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def analyze(self, cropped_bgr: np.ndarray) -> HsvFindings:
        import cv2

        s = self._settings
        total_pixels = cropped_bgr.shape[0] * cropped_bgr.shape[1]
        if total_pixels == 0:
            return HsvFindings(
                mud_coverage_ratio=0.0,
                blood_coverage_ratio=0.0,
                mud_detected=False,
                blood_detected=False,
            )

        hsv = cv2.cvtColor(cropped_bgr, cv2.COLOR_BGR2HSV)

        mud_mask = cv2.inRange(hsv, np.array(s.hsv_mud_lower), np.array(s.hsv_mud_upper))
        blood_mask_low = cv2.inRange(
            hsv, np.array(s.hsv_blood_lower1), np.array(s.hsv_blood_upper1)
        )
        blood_mask_high = cv2.inRange(
            hsv, np.array(s.hsv_blood_lower2), np.array(s.hsv_blood_upper2)
        )
        blood_mask = cv2.bitwise_or(blood_mask_low, blood_mask_high)

        mud_ratio = float(np.count_nonzero(mud_mask)) / total_pixels
        blood_ratio = float(np.count_nonzero(blood_mask)) / total_pixels

        return HsvFindings(
            mud_coverage_ratio=mud_ratio,
            blood_coverage_ratio=blood_ratio,
            mud_detected=mud_ratio >= s.hsv_coverage_alert_ratio,
            blood_detected=blood_ratio >= s.hsv_coverage_alert_ratio,
        )


@lru_cache
def get_head_feature_extractor() -> HeadFeatureExtractor:
    return HeadFeatureExtractor()


@lru_cache
def get_hsv_filter() -> HsvConditionFilter:
    return HsvConditionFilter()
