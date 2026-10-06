from __future__ import annotations

from app.services.feature_extraction import HsvConditionFilter


def test_clean_image_has_no_mud_or_blood(clean_pet_image):
    findings = HsvConditionFilter().analyze(clean_pet_image)
    assert findings.mud_detected is False
    assert findings.blood_detected is False


def test_muddy_image_flags_mud(muddy_pet_image):
    findings = HsvConditionFilter().analyze(muddy_pet_image)
    assert findings.mud_detected is True
    assert findings.mud_coverage_ratio > 0.5


def test_bloody_image_flags_blood(bloody_pet_image):
    findings = HsvConditionFilter().analyze(bloody_pet_image)
    assert findings.blood_detected is True
    assert findings.blood_coverage_ratio > 0.5


def test_empty_image_returns_zero_ratios():
    import numpy as np

    empty = np.zeros((0, 0, 3), dtype=np.uint8)
    findings = HsvConditionFilter().analyze(empty)
    assert findings.mud_coverage_ratio == 0.0
    assert findings.blood_coverage_ratio == 0.0
