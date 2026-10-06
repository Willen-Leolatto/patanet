"""Orquestração do pipeline biométrico: frames -> segmentação -> features."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.core.config import Settings, get_settings
from app.models.schemas import HeadFeatures, HsvFindings, MediaKind
from app.services.feature_extraction import (
    HeadFeatureExtractor,
    HsvConditionFilter,
    get_head_feature_extractor,
    get_hsv_filter,
)
from app.services.frame_extraction import FrameExtractor
from app.services.segmentation import NoPetDetectedError, SegmentationResult, YoloSegmenter, get_segmenter

# Proporção heurística da bounding box do animal considerada "região da
# cabeça" (contagem a partir do topo). Uma extração real de cabeça exigiria
# um modelo de pose/keypoints dedicado; este recorte é um proxy razoável
# para poses tipicamente frontais/laterais capturadas em avistamentos de rua.
HEAD_REGION_HEIGHT_RATIO = 0.4


class NoUsableFrameError(ValueError):
    """Nenhum frame da mídia enviada teve um animal detectável."""


@dataclass(frozen=True)
class PipelineResult:
    frames_analyzed: int
    primary_frame: np.ndarray
    segmentation: SegmentationResult
    head_features: HeadFeatures
    hsv_findings: HsvFindings


class VisionPipeline:
    def __init__(
        self,
        settings: Settings | None = None,
        frame_extractor: FrameExtractor | None = None,
        segmenter: YoloSegmenter | None = None,
        head_feature_extractor: HeadFeatureExtractor | None = None,
        hsv_filter: HsvConditionFilter | None = None,
    ) -> None:
        self._settings = settings or get_settings()
        self._frame_extractor = frame_extractor or FrameExtractor(self._settings)
        self._segmenter = segmenter or get_segmenter()
        self._head_feature_extractor = head_feature_extractor or get_head_feature_extractor()
        self._hsv_filter = hsv_filter or get_hsv_filter()

    def process_media(self, media_bytes: bytes, media_kind: MediaKind) -> PipelineResult:
        frames = self._load_frames(media_bytes, media_kind)

        best_segmentation: SegmentationResult | None = None
        best_frame: np.ndarray | None = None
        for frame in frames:
            try:
                segmentation = self._segmenter.segment(frame)
            except NoPetDetectedError:
                continue
            if best_segmentation is None or segmentation.confidence > best_segmentation.confidence:
                best_segmentation = segmentation
                best_frame = frame

        if best_segmentation is None or best_frame is None:
            raise NoUsableFrameError(
                "Nenhum cão ou gato foi detectado nos frames analisados."
            )

        head_crop = self._extract_head_region(best_segmentation.cropped_image)
        head_features = self._head_feature_extractor.extract(head_crop)
        hsv_findings = self._hsv_filter.analyze(best_segmentation.cropped_image)

        return PipelineResult(
            frames_analyzed=len(frames),
            primary_frame=best_frame,
            segmentation=best_segmentation,
            head_features=head_features,
            hsv_findings=hsv_findings,
        )

    def _load_frames(self, media_bytes: bytes, media_kind: MediaKind) -> list[np.ndarray]:
        if media_kind is MediaKind.VIDEO:
            scored_frames = self._frame_extractor.extract_best_frames(media_bytes)
            return [f.image for f in scored_frames]

        import cv2

        array = np.frombuffer(media_bytes, dtype=np.uint8)
        image = cv2.imdecode(array, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Não foi possível decodificar a imagem enviada.")
        return [image]

    @staticmethod
    def _extract_head_region(cropped_image: np.ndarray) -> np.ndarray:
        height = cropped_image.shape[0]
        head_height = max(1, int(height * HEAD_REGION_HEIGHT_RATIO))
        return cropped_image[:head_height, :]
