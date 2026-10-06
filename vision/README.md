# PataNet Vision

Microsserviço de visão computacional do PataNet: pipeline biométrico
(Head Invariance + HSV), triagem de maus-tratos e laudo empático via
Gemini 2.0 Flash.

## Estrutura

```
app/
  api/endpoints/   # sync.py (/internal/sync/pet), sightings.py (/internal/sightings/analyze)
  core/config.py   # Settings (Pydantic v2 / pydantic-settings)
  models/schemas.py
  services/
    frame_extraction.py   # melhores frames via variância do Laplaciano
    segmentation.py       # YOLOv8n-seg (isolamento de fundo + recorte)
    feature_extraction.py # CLIP ViT-B/32 (512D) + filtro HSV (lama/sangue)
    abuse_detector.py     # triagem visual de maus-tratos
    biometric_index.py    # índice FAISS de embeddings de cabeça
    vlm_report.py         # laudo via Gemini 2.0 Flash
    pipeline.py           # orquestração completa
```

Os serviços que dependem de bibliotecas pesadas (`torch`, `ultralytics`,
`open-clip-torch`, `faiss-cpu`, `google-genai`) fazem import tardio dentro
dos métodos, para permitir rodar a suíte de testes com dependências leves
(veja `requirements-dev.txt`) sem precisar instalar pesos de modelo.

## Desenvolvimento local

```bash
python -m venv .venv
.venv/Scripts/activate  # Windows
pip install -r requirements-dev.txt
pytest tests/
uvicorn app.main:app --port 8000
```

Para rodar com os modelos reais (produção), instale `requirements.txt`
(mais o torch CPU-only, ver `Dockerfile`) e configure `VISION_GEMINI_API_KEY`
em um `.env` (veja `.env.example`).

## Endpoints

- `POST /internal/sync/pet` — indexação biométrica de um pet cadastrado
  (form-data: `pet_id`, `media_kind`, `media`).
- `POST /internal/sightings/analyze` — relato anônimo "Avistei um Pet"
  (form-data: `media_kind`, `media`, `latitude`/`longitude`/`notes` opcionais).
- `GET /health` — health check.

## Limitações conhecidas do scaffold atual

- O recorte de "cabeça" usado no embedding CLIP é uma heurística (topo da
  bounding box do YOLO), não um modelo de pose/keypoints dedicado.
- A detecção de coleira incrustada em `AbuseDetector` é um placeholder
  explícito — ainda não há heurística/modelo implementado para isso.
- O índice FAISS é `IndexFlatIP` simples, sem remoção/atualização de
  embeddings por `pet_id`.
