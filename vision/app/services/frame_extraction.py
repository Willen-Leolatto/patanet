"""Extração dos melhores frames de vídeos curtos via variância do Laplaciano."""

from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from app.core.config import Settings, get_settings


@dataclass(frozen=True)
class ScoredFrame:
    frame_index: int
    timestamp_seconds: float
    sharpness_score: float
    image: np.ndarray


class VideoTooLongError(ValueError):
    """Vídeo excede a duração máxima aceita pelo pipeline."""


class FrameExtractor:
    """Seleciona os N frames mais nítidos de um vídeo, usando o Laplaciano.

    Frames borrados por movimento (comuns em avistamentos de rua) têm baixa
    variância no Laplaciano; os frames mais nítidos tendem a preservar melhor
    os detalhes anatômicos usados nas etapas seguintes do pipeline.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def extract_best_frames(self, video_bytes: bytes) -> list[ScoredFrame]:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = Path(tmp.name)

        try:
            return self._extract_from_path(tmp_path)
        finally:
            tmp_path.unlink(missing_ok=True)

    def _extract_from_path(self, path: Path) -> list[ScoredFrame]:
        capture = cv2.VideoCapture(str(path))
        if not capture.isOpened():
            raise ValueError("Não foi possível decodificar o vídeo enviado.")

        try:
            fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
            frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            duration_seconds = frame_count / fps if fps else 0.0

            if duration_seconds > self._settings.max_video_duration_seconds:
                raise VideoTooLongError(
                    f"Vídeo de {duration_seconds:.1f}s excede o limite de "
                    f"{self._settings.max_video_duration_seconds:.0f}s."
                )

            scored_frames: list[ScoredFrame] = []
            index = 0
            while True:
                success, frame = capture.read()
                if not success:
                    break
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
                scored_frames.append(
                    ScoredFrame(
                        frame_index=index,
                        timestamp_seconds=index / fps,
                        sharpness_score=score,
                        image=frame,
                    )
                )
                index += 1
        finally:
            capture.release()

        if not scored_frames:
            raise ValueError("Nenhum frame pôde ser lido do vídeo enviado.")

        top_frames = sorted(
            scored_frames, key=lambda f: f.sharpness_score, reverse=True
        )[: self._settings.num_best_frames]
        return sorted(top_frames, key=lambda f: f.frame_index)
