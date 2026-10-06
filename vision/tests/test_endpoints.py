from __future__ import annotations

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.api.endpoints import sightings, sync
from app.main import app
from app.models.schemas import (
    AbuseAssessment,
    HeadFeatures,
    HsvFindings,
    MediaKind,
    PetMatch,
    VetReport,
)
from app.services.pipeline import NoUsableFrameError, PipelineResult
from app.services.segmentation import SegmentationResult


def _fake_pipeline_result() -> PipelineResult:
    image = np.zeros((32, 32, 3), dtype=np.uint8)
    segmentation = SegmentationResult(
        cropped_image=image,
        mask=np.ones((32, 32), dtype=np.uint8),
        bounding_box=(0, 0, 32, 32),
        class_name="dog",
        confidence=0.9,
    )
    return PipelineResult(
        frames_analyzed=1,
        primary_frame=image,
        segmentation=segmentation,
        head_features=HeadFeatures(embedding=[0.1] * 512, model_name="fake-clip", dim=512),
        hsv_findings=HsvFindings(
            mud_coverage_ratio=0.0,
            blood_coverage_ratio=0.0,
            mud_detected=False,
            blood_detected=False,
        ),
    )


class FakePipeline:
    def __init__(self, result: PipelineResult | None = None, error: Exception | None = None):
        self._result = result
        self._error = error

    def process_media(self, media_bytes: bytes, media_kind: MediaKind) -> PipelineResult:
        if self._error is not None:
            raise self._error
        return self._result


class FakeBiometricIndex:
    def __init__(self, matches: list[PetMatch] | None = None) -> None:
        self.added: list[tuple[str, list[float]]] = []
        self._matches = matches or []

    def add(self, pet_id: str, embedding: list[float]) -> None:
        self.added.append((pet_id, embedding))

    def search(self, embedding: list[float]) -> list[PetMatch]:
        return self._matches


class FakeAbuseDetector:
    def assess(self, segmentation, hsv_findings) -> AbuseAssessment:
        return AbuseAssessment(abuse_suspected=False, indicators=[], confidence=0.0)


class FakeReportGenerator:
    def generate_report(self, best_frame_bgr, hsv_findings, abuse_assessment) -> VetReport:
        return VetReport(summary="tudo bem", recommendations=["acompanhar"])


def _image_upload_bytes() -> bytes:
    image = np.full((32, 32, 3), 100, dtype=np.uint8)
    ok, buffer = cv2.imencode(".png", image)
    assert ok
    return buffer.tobytes()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_sync_pet_indexes_embedding(client: TestClient):
    fake_index = FakeBiometricIndex()
    app.dependency_overrides[sync.get_pipeline] = lambda: FakePipeline(_fake_pipeline_result())
    app.dependency_overrides[sync.get_biometric_index] = lambda: fake_index

    response = client.post(
        "/internal/sync/pet",
        data={"pet_id": "pet-123", "media_kind": MediaKind.IMAGE.value},
        files={"media": ("pet.png", _image_upload_bytes(), "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["pet_id"] == "pet-123"
    assert body["indexed"] is True
    assert fake_index.added[0][0] == "pet-123"


def test_sync_pet_returns_422_when_no_pet_detected(client: TestClient):
    app.dependency_overrides[sync.get_pipeline] = lambda: FakePipeline(
        error=NoUsableFrameError("sem pet")
    )
    app.dependency_overrides[sync.get_biometric_index] = lambda: FakeBiometricIndex()

    response = client.post(
        "/internal/sync/pet",
        data={"pet_id": "pet-123", "media_kind": MediaKind.IMAGE.value},
        files={"media": ("pet.png", _image_upload_bytes(), "image/png")},
    )

    assert response.status_code == 422


def test_analyze_sighting_returns_matches_and_report(client: TestClient):
    matches = [PetMatch(pet_id="pet-999", similarity_score=0.9)]
    app.dependency_overrides[sightings.get_pipeline] = lambda: FakePipeline(_fake_pipeline_result())
    app.dependency_overrides[sightings.get_biometric_index] = lambda: FakeBiometricIndex(matches)
    app.dependency_overrides[sightings.get_abuse_detector] = lambda: FakeAbuseDetector()
    app.dependency_overrides[sightings.get_report_generator] = lambda: FakeReportGenerator()

    response = client.post(
        "/internal/sightings/analyze",
        data={"media_kind": MediaKind.IMAGE.value},
        files={"media": ("sighting.png", _image_upload_bytes(), "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["matches"][0]["pet_id"] == "pet-999"
    assert body["vet_report"]["summary"] == "tudo bem"


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
