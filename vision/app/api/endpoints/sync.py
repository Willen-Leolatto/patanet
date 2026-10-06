"""POST /internal/sync/pet — indexação biométrica de um pet cadastrado."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.models.schemas import MediaKind, SyncPetResponse
from app.services.biometric_index import FaissBiometricIndex, get_biometric_index
from app.services.pipeline import NoUsableFrameError, VisionPipeline

router = APIRouter()


def get_pipeline() -> VisionPipeline:
    return VisionPipeline()


@router.post("/sync/pet", response_model=SyncPetResponse)
async def sync_pet(
    pet_id: str = Form(...),
    media_kind: MediaKind = Form(MediaKind.IMAGE),
    media: UploadFile = File(...),
    pipeline: VisionPipeline = Depends(get_pipeline),
    biometric_index: FaissBiometricIndex = Depends(get_biometric_index),
) -> SyncPetResponse:
    media_bytes = await media.read()

    try:
        result = pipeline.process_media(media_bytes, media_kind)
    except NoUsableFrameError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    biometric_index.add(pet_id=pet_id, embedding=result.head_features.embedding)

    return SyncPetResponse(
        pet_id=pet_id,
        frames_analyzed=result.frames_analyzed,
        indexed=True,
        hsv_findings=result.hsv_findings,
    )
