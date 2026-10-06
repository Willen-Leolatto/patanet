"""Geração de laudo empático via Gemini 2.0 Flash (VLM forense veterinário)."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np

from app.core.config import Settings, get_settings
from app.models.schemas import AbuseAssessment, HsvFindings, VetReport

FORENSIC_PROMPT_TEMPLATE = """\
Você é um veterinário forense redigindo um laudo empático para o tutor ou \
agente de bem-estar animal que recebeu esta imagem.

Achados técnicos automatizados (contexto, não repita como lista crua):
- Sujidade/lama detectada: {mud_detected} (cobertura: {mud_ratio:.1%})
- Indícios de sangramento: {blood_detected} (cobertura: {blood_ratio:.1%})
- Suspeita de maus-tratos: {abuse_suspected}
- Indicadores observados: {indicators}

Escreva um laudo curto, acolhedor e sem jargão excessivo, explicando o que \
foi observado na imagem, o nível de urgência recomendado e os próximos \
passos práticos (ex.: procurar clínica veterinária, acionar órgão de \
proteção animal). Termine com uma lista de 2 a 4 recomendações objetivas.
"""


class GeminiUnavailableError(RuntimeError):
    """Chave de API do Gemini não configurada ou chamada ao modelo falhou."""


class GeminiReportGenerator:
    """Cliente fino para o Gemini 2.0 Flash, com prompt forense veterinário.

    O SDK (`google-genai`) é importado sob demanda para permitir carregar
    este módulo sem a dependência instalada (ex.: testes com dublês).
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._client: Any | None = None

    def _load_client(self) -> Any:
        if self._client is None:
            if not self._settings.gemini_api_key:
                raise GeminiUnavailableError(
                    "VISION_GEMINI_API_KEY não configurada."
                )
            from google import genai  # import pesado, carregado sob demanda

            self._client = genai.Client(api_key=self._settings.gemini_api_key)
        return self._client

    def generate_report(
        self,
        best_frame_bgr: np.ndarray,
        hsv_findings: HsvFindings,
        abuse_assessment: AbuseAssessment,
    ) -> VetReport:
        client = self._load_client()

        import cv2
        from PIL import Image

        rgb = cv2.cvtColor(best_frame_bgr, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb)

        prompt = FORENSIC_PROMPT_TEMPLATE.format(
            mud_detected=hsv_findings.mud_detected,
            mud_ratio=hsv_findings.mud_coverage_ratio,
            blood_detected=hsv_findings.blood_detected,
            blood_ratio=hsv_findings.blood_coverage_ratio,
            abuse_suspected=abuse_assessment.abuse_suspected,
            indicators=", ".join(abuse_assessment.indicators) or "nenhum",
        )

        response = client.models.generate_content(
            model=self._settings.gemini_model_name,
            contents=[prompt, pil_image],
        )
        text = response.text or ""
        summary, recommendations = self._split_recommendations(text)

        return VetReport(
            summary=summary,
            recommendations=recommendations,
            generated_by=self._settings.gemini_model_name,
        )

    @staticmethod
    def _split_recommendations(text: str) -> tuple[str, list[str]]:
        lines = [line.strip("-• \t") for line in text.splitlines() if line.strip()]
        recommendations = [line for line in lines if line.endswith((".", "!", "?")) is False][-4:]
        summary = "\n".join(lines) if lines else text
        return summary, recommendations


@lru_cache
def get_report_generator() -> GeminiReportGenerator:
    return GeminiReportGenerator()
