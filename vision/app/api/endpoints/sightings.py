"""POST /internal/sightings/analyze — relato anônimo "Avistei um Pet"."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.models.schemas import MediaKind, SightingAnalyzeResponse, VetReport
from app.services.abuse_detector import AbuseDetector, get_abuse_detector
from app.services.biometric_index import FaissBiometricIndex, get_biometric_index
from app.services.pipeline import NoUsableFrameError, VisionPipeline
from app.services.vlm_report import GeminiUnavailableError, GeminiReportGenerator, get_report_generator

router = APIRouter()


def get_pipeline() -> VisionPipeline:
    return VisionPipeline()


@router.post("/sightings/analyze", response_model=SightingAnalyzeResponse)
async def analyze_sighting(
    media_kind: MediaKind = Form(MediaKind.IMAGE),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    notes: str | None = Form(None),
    media: UploadFile = File(...),
    pipeline: VisionPipeline = Depends(get_pipeline),
    biometric_index: FaissBiometricIndex = Depends(get_biometric_index),
    abuse_detector: AbuseDetector = Depends(get_abuse_detector),
    report_generator: GeminiReportGenerator = Depends(get_report_generator),
) -> SightingAnalyzeResponse:
    media_bytes = await media.read()

    try:
        result = pipeline.process_media(media_bytes, media_kind)
    except NoUsableFrameError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    matches = biometric_index.search(result.head_features.embedding)
    abuse_assessment = abuse_detector.assess(result.segmentation, result.hsv_findings)

    try:
        vet_report = report_generator.generate_report(
            best_frame_bgr=result.primary_frame,
            hsv_findings=result.hsv_findings,
            abuse_assessment=abuse_assessment,
        )
    except GeminiUnavailableError:
        vet_report = VetReport(
            summary=(
                "Laudo automático indisponível no momento (integração com o "
                "Gemini não configurada). Os achados técnicos foram registrados "
                "e devem ser avaliados por um profissional."
            ),
            recommendations=["Procurar avaliação veterinária presencial."],
        )

    return SightingAnalyzeResponse(
        frames_analyzed=result.frames_analyzed,
        matches=matches,
        hsv_findings=result.hsv_findings,
        abuse_assessment=abuse_assessment,
        vet_report=vet_report,
    )
