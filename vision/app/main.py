"""Ponto de entrada FastAPI do PataNet Vision."""

from __future__ import annotations

from fastapi import FastAPI

from app.api.endpoints import sightings, sync
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=(
        "Pipeline biométrico e de triagem de bem-estar animal do PataNet: "
        "Head Invariance (CLIP), filtragem HSV, detecção de maus-tratos e "
        "laudos explicativos via Gemini 2.0 Flash."
    ),
)

app.include_router(sync.router, prefix=settings.api_v1_prefix, tags=["sync"])
app.include_router(sightings.router, prefix=settings.api_v1_prefix, tags=["sightings"])


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
