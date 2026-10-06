from __future__ import annotations

import cv2
import numpy as np
import pytest

from app.core.config import Settings
from app.models.schemas import HeadFeatures, HsvFindings, MediaKind
from app.services.pipeline import NoUsableFrameError, VisionPipeline
from app.services.segmentation import NoPetDetectedError, SegmentationResult


class FakeSegmenter:
    def __init__(self, should_detect: bool = True) -> None:
        self.should_detect = should_detect
        self.calls = 0

    def segment(self, image: np.ndarray) -> SegmentationResult:
        self.calls += 1
        if not self.should_detect:
            raise NoPetDetectedError("sem detecção")
        return SegmentationResult(
            cropped_image=image,
            mask=np.ones(image.shape[:2], dtype=np.uint8),
            bounding_box=(0, 0, image.shape[1], image.shape[0]),
            class_name="dog",
            confidence=0.9,
        )


class FakeHeadFeatureExtractor:
    def extract(self, head_crop: np.ndarray) -> HeadFeatures:
        return HeadFeatures(embedding=[0.1] * 512, model_name="fake-clip", dim=512)


class FakeHsvFilter:
    def analyze(self, cropped: np.ndarray) -> HsvFindings:
        return HsvFindings(
            mud_coverage_ratio=0.0,
            blood_coverage_ratio=0.0,
            mud_detected=False,
            blood_detected=False,
        )


def _image_bytes(color=(100, 100, 100)) -> bytes:
    image = np.full((64, 64, 3), color, dtype=np.uint8)
    ok, buffer = cv2.imencode(".png", image)
    assert ok
    return buffer.tobytes()


def test_process_media_image_happy_path():
    pipeline = VisionPipeline(
        settings=Settings(),
        segmenter=FakeSegmenter(should_detect=True),
        head_feature_extractor=FakeHeadFeatureExtractor(),
        hsv_filter=FakeHsvFilter(),
    )

    result = pipeline.process_media(_image_bytes(), MediaKind.IMAGE)

    assert result.frames_analyzed == 1
    assert result.head_features.dim == 512
    assert result.hsv_findings.mud_detected is False


def test_process_media_raises_when_no_pet_detected():
    pipeline = VisionPipeline(
        settings=Settings(),
        segmenter=FakeSegmenter(should_detect=False),
        head_feature_extractor=FakeHeadFeatureExtractor(),
        hsv_filter=FakeHsvFilter(),
    )

    with pytest.raises(NoUsableFrameError):
        pipeline.process_media(_image_bytes(), MediaKind.IMAGE)


def test_process_media_invalid_image_bytes_raise_value_error():
    pipeline = VisionPipeline(
        settings=Settings(),
        segmenter=FakeSegmenter(should_detect=True),
        head_feature_extractor=FakeHeadFeatureExtractor(),
        hsv_filter=FakeHsvFilter(),
    )

    with pytest.raises(ValueError):
        pipeline.process_media(b"not an image", MediaKind.IMAGE)
