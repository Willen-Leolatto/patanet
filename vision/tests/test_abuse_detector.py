from __future__ import annotations

import numpy as np

from app.core.config import Settings
from app.models.schemas import HsvFindings
from app.services.abuse_detector import AbuseDetector
from app.services.segmentation import SegmentationResult


def _segmentation_with_fill_ratio(fill_ratio: float) -> SegmentationResult:
    box = (0, 0, 10, 10)  # área 100
    mask = np.zeros((20, 20), dtype=np.uint8)
    filled_pixels = int(fill_ratio * 100)
    mask.flat[:filled_pixels] = 1
    return SegmentationResult(
        cropped_image=np.zeros((10, 10, 3), dtype=np.uint8),
        mask=mask,
        bounding_box=box,
        class_name="dog",
        confidence=0.9,
    )


def test_no_indicators_means_no_abuse_suspected():
    detector = AbuseDetector()
    segmentation = _segmentation_with_fill_ratio(0.9)
    hsv = HsvFindings(
        mud_coverage_ratio=0.0,
        blood_coverage_ratio=0.0,
        mud_detected=False,
        blood_detected=False,
    )

    result = detector.assess(segmentation, hsv)

    assert result.abuse_suspected is False
    assert result.indicators == []
    assert result.confidence == 0.0


def test_blood_detected_flags_abuse():
    detector = AbuseDetector()
    segmentation = _segmentation_with_fill_ratio(0.9)
    hsv = HsvFindings(
        mud_coverage_ratio=0.0,
        blood_coverage_ratio=0.5,
        mud_detected=False,
        blood_detected=True,
    )

    result = detector.assess(segmentation, hsv)

    assert result.abuse_suspected is True
    assert any("sangramento" in i for i in result.indicators)
    assert result.confidence > 0.0


def test_low_fill_ratio_flags_malnutrition_indicator():
    detector = AbuseDetector()
    segmentation = _segmentation_with_fill_ratio(0.2)
    hsv = HsvFindings(
        mud_coverage_ratio=0.0,
        blood_coverage_ratio=0.0,
        mud_detected=False,
        blood_detected=False,
    )

    result = detector.assess(segmentation, hsv)

    assert result.abuse_suspected is True
    assert any("desnutrição" in i for i in result.indicators)


def test_mud_threshold_uses_configured_settings():
    settings = Settings(abuse_wound_coverage_threshold=0.05, abuse_min_indicators_for_flag=1)
    detector = AbuseDetector(settings)
    segmentation = _segmentation_with_fill_ratio(0.9)
    hsv = HsvFindings(
        mud_coverage_ratio=0.06,
        blood_coverage_ratio=0.0,
        mud_detected=True,
        blood_detected=False,
    )

    result = detector.assess(segmentation, hsv)

    assert result.abuse_suspected is True
    assert any("abandono" in i for i in result.indicators)
