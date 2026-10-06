from __future__ import annotations

import numpy as np
import pytest


def _solid_bgr_image(height: int, width: int, color: tuple[int, int, int]) -> np.ndarray:
    image = np.zeros((height, width, 3), dtype=np.uint8)
    image[:, :] = color
    return image


@pytest.fixture
def clean_pet_image() -> np.ndarray:
    """Imagem sintética neutra (cinza), sem lama/sangue."""
    return _solid_bgr_image(120, 100, (120, 120, 120))


@pytest.fixture
def muddy_pet_image() -> np.ndarray:
    """Imagem sintética predominantemente na faixa HSV de lama."""
    image = _solid_bgr_image(120, 100, (120, 120, 120))
    # BGR aproximando um tom de lama (marrom) dentro dos limiares HSV configurados.
    image[:, :] = (30, 90, 130)
    return image


@pytest.fixture
def bloody_pet_image() -> np.ndarray:
    """Imagem sintética predominantemente na faixa HSV de sangue (vermelho vivo)."""
    image = _solid_bgr_image(120, 100, (120, 120, 120))
    image[:, :] = (20, 20, 200)  # BGR vermelho saturado
    return image


@pytest.fixture
def image_bytes(clean_pet_image: np.ndarray) -> bytes:
    import cv2

    success, buffer = cv2.imencode(".png", clean_pet_image)
    assert success
    return buffer.tobytes()
