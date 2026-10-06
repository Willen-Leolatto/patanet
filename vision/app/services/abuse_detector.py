"""Triagem visual de maus-tratos para apoio a órgãos públicos.

Não substitui laudo veterinário/perícia oficial: sinaliza indícios visuais
(ferimentos, desnutrição severa, coleiras incrustadas) para priorização de
atendimento, com base nos achados de segmentação e filtragem HSV já
calculados pelas etapas anteriores do pipeline.
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import Settings, get_settings
from app.models.schemas import AbuseAssessment, HsvFindings
from app.services.segmentation import SegmentationResult


class AbuseDetector:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def assess(
        self,
        segmentation: SegmentationResult,
        hsv_findings: HsvFindings,
    ) -> AbuseAssessment:
        indicators: list[str] = []

        if hsv_findings.blood_detected:
            indicators.append("possível ferimento com sangramento visível")
        if hsv_findings.mud_coverage_ratio >= self._settings.abuse_wound_coverage_threshold:
            indicators.append("excesso de sujidade/lama compatível com abandono")

        malnutrition_indicator = self._check_body_condition(segmentation)
        if malnutrition_indicator:
            indicators.append(malnutrition_indicator)

        collar_indicator = self._check_embedded_collar(segmentation)
        if collar_indicator:
            indicators.append(collar_indicator)

        abuse_suspected = len(indicators) >= self._settings.abuse_min_indicators_for_flag
        confidence = min(1.0, 0.25 * len(indicators)) if abuse_suspected else 0.0

        return AbuseAssessment(
            abuse_suspected=abuse_suspected,
            indicators=indicators,
            confidence=confidence,
        )

    def _check_body_condition(self, segmentation: SegmentationResult) -> str | None:
        """Heurística de silhueta: proporção de pixels do animal na bounding box.

        Um recorte de segmentação com baixa razão máscara/caixa pode indicar
        um corpo muito magro (costelas/quadris salientes reduzem a área de
        massa corporal contígua). É um sinal preliminar, não diagnóstico.
        """

        x1, y1, x2, y2 = segmentation.bounding_box
        box_area = max(1, (x2 - x1) * (y2 - y1))
        mask_area = int(segmentation.mask.sum())
        fill_ratio = mask_area / box_area if box_area else 0.0

        if fill_ratio < 0.45:
            return "silhueta compatível com desnutrição severa (avaliação preliminar)"
        return None

    def _check_embedded_collar(self, segmentation: SegmentationResult) -> str | None:
        """Placeholder para detecção de coleira incrustada.

        Requer um modelo/heurística dedicada sobre a região cervical; mantido
        como interface explícita para não mascarar a ausência dessa análise.
        """

        return None


@lru_cache
def get_abuse_detector() -> AbuseDetector:
    return AbuseDetector()
