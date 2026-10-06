"""Isolamento do fundo urbano e recorte anatômico via YOLOv8n-seg."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import numpy as np

from app.core.config import Settings, get_settings


@dataclass(frozen=True)
class SegmentationResult:
    """Recorte do animal com o fundo urbano removido (pixels fora da máscara = 0)."""

    cropped_image: np.ndarray
    mask: np.ndarray
    bounding_box: tuple[int, int, int, int]  # x1, y1, x2, y2
    class_name: str
    confidence: float


class NoPetDetectedError(ValueError):
    """Nenhum cão/gato foi detectado no frame analisado."""


class YoloSegmenter:
    """Wrapper fino sobre a Ultralytics YOLOv8n-seg.

    O modelo é carregado sob demanda (lazy) para que módulos que dependem
    deste serviço possam ser importados em ambientes sem `ultralytics`/`torch`
    instalados (ex.: testes unitários com dublês de teste).
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._model: Any | None = None

    def _load_model(self) -> Any:
        if self._model is None:
            from ultralytics import YOLO  # import pesado, carregado sob demanda

            self._model = YOLO(self._settings.yolo_model_path)
        return self._model

    def segment(self, image: np.ndarray) -> SegmentationResult:
        model = self._load_model()
        results = model.predict(
            source=image,
            conf=self._settings.yolo_confidence_threshold,
            verbose=False,
        )
        return self._best_pet_detection(results[0], image)

    def _best_pet_detection(self, result: Any, image: np.ndarray) -> SegmentationResult:
        names = result.names
        best: SegmentationResult | None = None

        boxes = getattr(result, "boxes", None)
        masks = getattr(result, "masks", None)
        if boxes is None or masks is None:
            raise NoPetDetectedError("Nenhuma detecção retornada pelo modelo de segmentação.")

        for i, box in enumerate(boxes):
            class_id = int(box.cls[0])
            class_name = names.get(class_id, str(class_id))
            if class_name not in self._settings.yolo_pet_class_names:
                continue

            confidence = float(box.conf[0])
            if best is not None and confidence <= best.confidence:
                continue

            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0])
            mask_array = masks.data[i].cpu().numpy()
            resized_mask = self._resize_mask(mask_array, image.shape[:2])
            cropped = self._apply_mask_and_crop(image, resized_mask, (x1, y1, x2, y2))

            best = SegmentationResult(
                cropped_image=cropped,
                mask=resized_mask,
                bounding_box=(x1, y1, x2, y2),
                class_name=class_name,
                confidence=confidence,
            )

        if best is None:
            raise NoPetDetectedError("Nenhum cão ou gato foi detectado no frame.")
        return best

    @staticmethod
    def _resize_mask(mask: np.ndarray, target_shape: tuple[int, int]) -> np.ndarray:
        import cv2

        return cv2.resize(mask, (target_shape[1], target_shape[0]))

    @staticmethod
    def _apply_mask_and_crop(
        image: np.ndarray, mask: np.ndarray, box: tuple[int, int, int, int]
    ) -> np.ndarray:
        x1, y1, x2, y2 = box
        binary_mask = (mask > 0.5).astype(np.uint8)[..., None]
        masked = image * binary_mask
        return masked[y1:y2, x1:x2]


@lru_cache
def get_segmenter() -> YoloSegmenter:
    return YoloSegmenter()
