"""Índice biométrico FAISS para correspondência de embeddings de cabeça."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from app.core.config import Settings, get_settings
from app.models.schemas import PetMatch


class FaissBiometricIndex:
    """Wrapper sobre um índice FAISS (produto interno) persistido em disco.

    O FAISS é importado sob demanda para permitir carregar este módulo em
    ambientes sem `faiss-cpu` instalado.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._index: Any | None = None
        self._pet_ids: list[str] = []

    def _index_path(self) -> Path:
        return Path(self._settings.faiss_index_path)

    def _id_map_path(self) -> Path:
        return Path(self._settings.faiss_id_map_path)

    def _load(self) -> Any:
        if self._index is not None:
            return self._index

        import faiss  # import pesado, carregado sob demanda

        index_path = self._index_path()
        id_map_path = self._id_map_path()

        if index_path.exists() and id_map_path.exists():
            self._index = faiss.read_index(str(index_path))
            self._pet_ids = json.loads(id_map_path.read_text(encoding="utf-8"))
        else:
            self._index = faiss.IndexFlatIP(self._settings.clip_embedding_dim)
            self._pet_ids = []

        return self._index

    def _persist(self) -> None:
        import faiss

        index_path = self._index_path()
        id_map_path = self._id_map_path()
        index_path.parent.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self._index, str(index_path))
        id_map_path.write_text(json.dumps(self._pet_ids), encoding="utf-8")

    def add(self, pet_id: str, embedding: list[float]) -> None:
        index = self._load()
        vector = np.array([embedding], dtype="float32")
        index.add(vector)
        self._pet_ids.append(pet_id)
        self._persist()

    def search(self, embedding: list[float]) -> list[PetMatch]:
        index = self._load()
        if index.ntotal == 0:
            return []

        vector = np.array([embedding], dtype="float32")
        top_k = min(self._settings.faiss_match_top_k, index.ntotal)
        scores, ids = index.search(vector, top_k)

        matches: list[PetMatch] = []
        for score, idx in zip(scores[0], ids[0], strict=True):
            if idx < 0 or score < self._settings.faiss_match_score_threshold:
                continue
            matches.append(PetMatch(pet_id=self._pet_ids[idx], similarity_score=float(score)))
        return matches


@lru_cache
def get_biometric_index() -> FaissBiometricIndex:
    return FaissBiometricIndex()
