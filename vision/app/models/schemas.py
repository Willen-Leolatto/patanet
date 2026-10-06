"""Schemas Pydantic v2 compartilhados pela API do PataNet Vision."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class MediaKind(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


class HeadFeatures(BaseModel):
    """Embedding estrutural da cabeça extraído via CLIP ViT-B/32."""

    model_config = ConfigDict(frozen=True)

    embedding: list[float] = Field(min_length=1)
    model_name: str
    dim: int


class HsvFindings(BaseModel):
    """Resultado da filtragem HSV para lama e sangue sobre a região anatômica."""

    mud_coverage_ratio: float = Field(ge=0.0, le=1.0)
    blood_coverage_ratio: float = Field(ge=0.0, le=1.0)
    mud_detected: bool
    blood_detected: bool


class AbuseAssessment(BaseModel):
    """Saída da triagem visual de maus-tratos (apoio a órgãos públicos)."""

    abuse_suspected: bool
    indicators: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class VetReport(BaseModel):
    """Laudo explicativo gerado pelo Gemini 2.0 Flash para o tutor/órgão público."""

    summary: str
    recommendations: list[str] = Field(default_factory=list)
    generated_by: str = "gemini-2.0-flash"


class BestFrame(BaseModel):
    """Metadados de um frame selecionado pelo critério de nitidez (Laplaciano)."""

    frame_index: int
    sharpness_score: float
    timestamp_seconds: float


class PetMatch(BaseModel):
    """Correspondência biométrica encontrada no índice FAISS."""

    pet_id: str
    similarity_score: float = Field(ge=0.0, le=1.0)


class SyncPetRequest(BaseModel):
    """Metadados que acompanham a mídia enviada em /internal/sync/pet."""

    pet_id: str = Field(min_length=1)
    media_kind: MediaKind = MediaKind.IMAGE


class SyncPetResponse(BaseModel):
    pet_id: str
    frames_analyzed: int
    indexed: bool
    hsv_findings: HsvFindings


class SightingAnalyzeRequest(BaseModel):
    """Metadados opcionais de um relato anônimo ("Avistei um Pet")."""

    latitude: float | None = None
    longitude: float | None = None
    notes: str | None = None
    media_kind: MediaKind = MediaKind.IMAGE


class SightingAnalyzeResponse(BaseModel):
    frames_analyzed: int
    matches: list[PetMatch] = Field(default_factory=list)
    hsv_findings: HsvFindings
    abuse_assessment: AbuseAssessment
    vet_report: VetReport
