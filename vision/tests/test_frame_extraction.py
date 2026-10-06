from __future__ import annotations

import cv2
import numpy as np
import pytest

from app.core.config import Settings
from app.services.frame_extraction import FrameExtractor, VideoTooLongError


def _encode_video(frames: list[np.ndarray], fps: float = 10.0) -> bytes:
    import tempfile
    from pathlib import Path

    tmp_path = Path(tempfile.NamedTemporaryFile(suffix=".avi", delete=False).name)
    height, width = frames[0].shape[:2]
    writer = cv2.VideoWriter(
        str(tmp_path), cv2.VideoWriter_fourcc(*"MJPG"), fps, (width, height)
    )
    for frame in frames:
        writer.write(frame)
    writer.release()

    data = tmp_path.read_bytes()
    tmp_path.unlink(missing_ok=True)
    return data


def _sharp_frame() -> np.ndarray:
    # Padrão de xadrez de alta frequência -> alta variância no Laplaciano.
    frame = np.zeros((64, 64, 3), dtype=np.uint8)
    frame[::2, ::2] = 255
    frame[1::2, 1::2] = 255
    return frame


def _blurry_frame() -> np.ndarray:
    return np.full((64, 64, 3), 128, dtype=np.uint8)


def test_extract_best_frames_prefers_sharper_frames():
    frames = [_blurry_frame(), _sharp_frame(), _blurry_frame(), _sharp_frame(), _blurry_frame()]
    video_bytes = _encode_video(frames)

    settings = Settings(num_best_frames=2, max_video_duration_seconds=15.0)
    extractor = FrameExtractor(settings)

    best = extractor.extract_best_frames(video_bytes)

    assert len(best) == 2
    assert {f.frame_index for f in best} == {1, 3}


def test_video_exceeding_max_duration_raises():
    frames = [_blurry_frame()] * 20
    video_bytes = _encode_video(frames, fps=1.0)  # 20s de vídeo

    settings = Settings(max_video_duration_seconds=15.0)
    extractor = FrameExtractor(settings)

    with pytest.raises(VideoTooLongError):
        extractor.extract_best_frames(video_bytes)


def test_invalid_video_bytes_raise_value_error():
    extractor = FrameExtractor(Settings())
    with pytest.raises(ValueError):
        extractor.extract_best_frames(b"not a real video")
