"""Configuração centralizada do PataNet Vision via Pydantic v2 Settings."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="VISION_",
        extra="ignore",
    )

    # Metadados do serviço
    app_name: str = "PataNet Vision"
    api_v1_prefix: str = "/internal"

    # Extração de frames
    max_video_duration_seconds: float = 15.0
    num_best_frames: int = 5

    # Segmentação (YOLOv8n-seg)
    yolo_model_path: str = "yolov8n-seg.pt"
    yolo_pet_class_names: tuple[str, ...] = ("dog", "cat")
    yolo_confidence_threshold: float = 0.35

    # Features biométricas (CLIP ViT-B/32)
    clip_model_name: str = "ViT-B-32"
    clip_pretrained: str = "openai"
    clip_embedding_dim: int = 512

    # Filtro HSV (lama / sangue)
    hsv_mud_lower: tuple[int, int, int] = (10, 40, 20)
    hsv_mud_upper: tuple[int, int, int] = (30, 200, 180)
    hsv_blood_lower1: tuple[int, int, int] = (0, 70, 50)
    hsv_blood_upper1: tuple[int, int, int] = (10, 255, 255)
    hsv_blood_lower2: tuple[int, int, int] = (170, 70, 50)
    hsv_blood_upper2: tuple[int, int, int] = (180, 255, 255)
    hsv_coverage_alert_ratio: float = 0.08

    # Triagem de maus-tratos
    abuse_wound_coverage_threshold: float = 0.12
    abuse_min_indicators_for_flag: int = 1

    # Índice biométrico (FAISS)
    faiss_index_path: str = "data/faiss/head_embeddings.index"
    faiss_id_map_path: str = "data/faiss/head_embeddings.ids.json"
    faiss_match_top_k: int = 5
    faiss_match_score_threshold: float = 0.75

    # Gemini 2.0 Flash (VLM para laudo)
    gemini_api_key: str | None = Field(default=None)
    gemini_model_name: str = "gemini-2.0-flash"


@lru_cache
def get_settings() -> Settings:
    return Settings()
