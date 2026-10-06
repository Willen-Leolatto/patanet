# PataNet — Contexto de Continuidade e Handover de Engenharia

> **Instrução para a Inteligência Artificial / Agente no ambiente de trabalho:**  
> *"Leia este arquivo na íntegra. Ele é a única fonte da verdade do ecossistema PataNet: consolida o estado real do projeto, as decisões de engenharia, a topologia de infraestrutura, os contratos técnicos, o histórico de entregas e o checklist dinâmico de próximos passos."*

---

## 1. Identificação do Projeto e Repositórios Sincronizados

O ecossistema **PataNet (PetEasy)** opera consolidado no diretório local `c:\WillenWorks\PataNet`:

| Sistema | Diretório Local | Repositório Remoto | Branch Ativa | Commit Atual | Função |
|---|---|---|---|---|---|
| **Backend API** | [api/](file:///c:/WillenWorks/PataNet/api) | `https://github.com/Patanet-PetEasy/api.git` | `dev` | `33aaea4` | API NestJS (Clean Architecture / DDD, Prisma ORM, Swagger) |
| **Frontend App** | [app/](file:///c:/WillenWorks/PataNet/app) | `https://github.com/Patanet-PetEasy/app.git` | `dev` | `d83ce6d` | App Mobile/Web (React 19, Vite 7, Capacitor 7 Android) |
| **Visão Computacional** | [patanet-vision/](file:///c:/WillenWorks/PataNet/patanet-vision) | `https://github.com/Willen-Leolatto/patanet-vision.git` | `master` | `40349bd` | Microsserviço IA (FastAPI, Pydantic v2, YOLOv8, CLIP, Gemini VLM) |

> **Governança Git:**
> - Organização proprietária: `Patanet-PetEasy`.
> - Branch de trabalho/desenvolvimento: `dev` (no backend `api` e frontend `app`).
> - Branch de produção na Hostinger: `main` (apenas código limpo e compilado).

---

## 2. Topologia de Infraestrutura Atual (Produção na Hostinger)

- **Servidor:** VPS Hostinger KVM (`srv1042161.hstgr.cloud`)
- **IP Público:** `72.60.245.7`
- **Domínio da API:** `api.patanet.app.br` (CNAME apontando para `srv1042161.hstgr.cloud`)
- **Webserver / Proxy Reverso:** Nginx (portas 80/443 com SSL Let's Encrypt), roteando para o NestJS em produção.
- **Banco em Produção Original:** MySQL 8.4 (em processo de migração para PostgreSQL 16).
- **Armazenamento de Fotos:** AWS S3 (`AWS_ENDPOINT`, `AWS_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`).
- **Gatilho de Deploy:** Webhook GitHub na branch `main` do repositório `Patanet-PetEasy/api`.

---

## 3. Decisões Técnicas e Arquitetura do Sistema

### 3.1 Migração de Banco de Dados: MySQL ➔ PostgreSQL 16 + Prisma ORM
1. **Motivação:** Suporte nativo a UUID v4 de 16 bytes (MySQL simula com VARCHAR(36)), suporte a `pgvector` para embeddings de IA e consistência transacional sob alta concorrência.
2. **Prisma ORM:** Eliminação das 28 migrações manuais do TypeORM. Manutenção estrita da Clean Architecture: as entidades de domínio e casos de uso mantêm interfaces puras; apenas `infrastructure/persistence/prisma/` foi implementada.
3. **Mapeamento de Portas Locais (Docker Desktop):**
   - **PostgreSQL Dev:** Porta `5434` (container `postgres` no `api/docker-compose.yml`, banco `patanet_dev`). *Nota: usa a porta 5434 para não colidir com portas 5432/5433 de outros projetos locais.*
   - **PostgreSQL Test:** Porta `5433` (container `postgres-test`, banco `patanet_test`).

### 3.2 PataNet Vision (Microsserviço de Identificação de Pets & Resgate)
- **Tecnologias:** Python 3.11, FastAPI, Pydantic v2, PyTorch, YOLOv8n-seg, CLIP ViT-B/32, FAISS, OpenCV.
- **Resiliência a Degradação Urbana:** Isolamento craniofacial contra desnutrição severa e filtragem cromática HSV de lama e sangue para não falsear a pelagem real.
- **Laudo Forense Multimodal:** Integração com Gemini 2.0 Flash VLM para laudos empáticos e detalhados.
- **Jornada de Avistamento sem Login:** Rota pública `POST /internal/sightings/analyze` permitindo relatos de rua em menos de 10 segundos.

---

## 4. Histórico das Waves Entregues (100% Codificadas nos Repositórios)

- [x] **Wave 1: Banco de Dados, Docker & Prisma ORM (`commit 5c07425` na api)**
  - Schema unificado com 22 modelos, migração estrutural completa, remoção de TypeORM e `mysql2`.
- [x] **Wave 2: Swagger OpenAPI & Estabilização da Suíte E2E (`commit 384d2fe` na api)**
  - Swagger ativo em `/api/docs`, export em `docs/swagger.json` (60 rotas), 108/108 testes E2E passando com `--runInBand` e isolamento.
- [x] **Wave 3: Módulos de Negócio, CRMV, Petshops PJ, Adoção & Play Store (`commit ac85715` na api)**
  - Módulo veterinário `/vet` com CRMV e prontuário médico imutável; Petshops PJ com Adoção Responsável (`TransferPetCustodyUseCase`); `TermsAcceptedGuard`; Exclusão de conta in-app e pública (`/delete-account`); Fila de espera em eventos (`WAITLIST`).
- [x] **Wave 4: PataNet Vision — IA Biométrica & Laudo Forense VLM (`commit 40349bd` no patanet-vision)**
  - Scaffold FastAPI + Pydantic v2, extração dos top-5 frames por variância Laplaciana, `AbuseDetector`, `VlmReportService` com Gemini e Dockerfile CPU.
- [x] **Wave 5: Frontend Mobile & Monorepo DevOps (`commit a28ee9e` no app)**
  - Telas React 19 / Vite / Capacitor 7 (Termos LGPD, Presença/Waitlist, Vitrine de Adoção, CRMV em vacinas, Avistei um Pet público, Exclusão de conta); 10 testes Vitest passando; Build Android validado.
- [x] **Wave 6: Estabilização de Contratos Fullstack & Runner E2E de 14 Baterias (`api/test/e2e-batteries.runner.ts`)**
  - Implementação do runner automatizado cobrindo 14 baterias funcionais e mais de 85 rotas da API.
  - 100% de aprovação (73/73 requisições green, tempo médio 61ms, relatório em `api/test/e2e-batteries-report.json`).
  - Triagem e alinhamento de contrato em 5 pontos críticos entre Frontend (`app/src/api/*.js`) e Backend NestJS:
    1. `ReportsController`: inclusão do alias `@Get(['mine', 'me'])` para compatibilidade com `reports.api.js`.
    2. `PostsController`: retorno de `ResponsePostDto` no `POST /posts` para disponibilização imediata do ID e dados do post para a UI.
    3. `CommentsController`: suporte unificado a `{ message }` e `{ content }` na criação e edição de comentários.
    4. `CreateAdoptionRequestDto` & `AnimalAdoptionRequestsController`: alias de rota `@Post([':id/adoption-requests', ':id/adoption-applications'])` e campos de assinatura digital (`signatureName`, `termVersion`).
    5. `CreateVaccineDto`: suporte a campos clínicos de CRMV e lote (`vetName`, `crmv`, `crmvUf`, `batchNumber`) enviados pela carteira do app.
  - Regressão Jest validada com sucesso: 92/92 suites e 282/282 testes unitários aprovados (`pnpm test`).

---

## 5. Checklist Mestre de Continuidade (Próximas Fases e Status Aberto)

> **Regra:** Marque os itens com `[x]` conforme forem sendo executados pelo agente desenvolvedor ou arquiteto.

### Fase A: Homologação Local e Banco de Dados (EM ANDAMENTO)
- [x] **A.1 Configuração do Banco Local PostgreSQL e Seed de Teste**
  - [x] Subir o container Docker `postgres` na porta `5434` (`docker compose up -d postgres`).
  - [x] Atualizar o arquivo `api/.env` com a `DATABASE_URL` do PostgreSQL 16 (`localhost:5434/patanet_dev`).
  - [x] Instalar dependências e gerar Prisma Client (`pnpm run prisma:generate`).
  - [x] Executar migrações pendentes no banco (`npx prisma migrate deploy` — 2 migrações aplicadas).
  - [x] Popular catálogo oficial de 2 espécies e 28 raças com fotos S3 e atributos pré-definidos (`api/seed/breeds_data.json` -> `api/prisma/seed.ts`).
  - [x] Executar o seed completo com as contas cadastradas e pets vinculados às raças oficiais (`pnpm run db:seed`).
  - [x] Validar integridade via consulta e inicializar API NestJS na porta `3001` (`pnpm run start:dev`).
  - [x] Desbloquear catálogo de espécies e raças sem exigência prematura de termos de uso (`@SkipTermsCheck()` nos controllers).
  - [x] Garantir inicialização de novos usuários com termos aceitos (`termsVersion: '1.0'`) e rotas de aceite sincronizadas (`GET/POST /users/me/terms`).
  - [x] Subir container MinIO S3 local (`api-minio-1`: portas 9000/9001) e adicionar resiliência com fallback a falhas no `S3StorageAdapter`.
  - [x] Implementar rotas REST e resumo de conexões em `ConnectionsController` (`POST /connections/:id`, `DELETE /connections/:id`, `GET /connections/summary/:id`, `GET /connections/followeds/:id`).
- [x] **A.2 Automação e Auditoria de Contratos E2E (14 Baterias)**
  - [x] Execução da suíte E2E automatizada (`pnpm run test:batteries`): 73/73 asserções green nas 14 baterias.
  - [x] Alinhamento bidirecional de DTOs e rotas entre Frontend (`app/src/api/*.js`) e Backend (`api/src/modules/`).
  - [x] Suíte de testes unitários Jest (`pnpm test`): 92/92 suites aprovadas, 282/282 testes passando.
- [ ] **A.3 Homologação E2E Manual no Frontend com Contas de Teste**
  - [ ] Validar Jornada 1: Tutor & Modal de Termos LGPD (`usuario.sem.termos@patanet.app.br`).
  - [ ] Validar Jornada 2: Médico Veterinário com CRMV validado (`vet.aprovado@patanet.app.br`).
  - [ ] Validar Jornada 3: Petshop Parceira & Adoção Responsável (`petshop.parceira@patanet.app.br` / `adotante@patanet.app.br`).
  - [ ] Validar Jornada 4: Pedestre na rua com relato sem login (`/avistei-um-pet`).
  - [ ] Validar Jornada 5: Exclusão de conta com usuário sentinela (`deleted-user@patanet.internal`).
- [ ] **A.4 Ativação e Teste do PataNet Vision com Gemini API**
  - [ ] Inserir chave `GEMINI_API_KEY` no `patanet-vision/.env`.
  - [ ] Executar testes de laudo forense VLM com envio de fotos reais de cães.

### Fase B: Deploy em Produção na Hostinger VPS (`72.60.245.7`) (Aguardando)
- [ ] **B.1 Preparação da VPS Hostinger**
  - [ ] Verificar Docker e Docker Compose na VPS.
  - [ ] Subir container PostgreSQL 16 de produção.
  - [ ] Configurar `.env` de produção com credenciais seguras e S3.
  - [ ] Executar `npx prisma migrate deploy` na VPS.
- [ ] **B.2 Configuração de Nginx e Webhook de Deploy**
  - [ ] Atualizar proxy reverso Nginx para o NestJS.
  - [ ] Testar rotas de produção (`https://api.patanet.app.br/api/docs`).

### Fase C: Publicação na Google Play Store (Aguardando)
- [ ] **C.1 Build e Assinatura do App Android**
  - [ ] Gerar bundle de release assinado via Capacitor (`pnpm cap open android`).
- [ ] **C.2 Submissão e Conformidade**
  - [ ] Validar rota pública desautenticada de exclusão de conta (`https://patanet.app.br/delete-account`).
  - [ ] Validar link público de política de privacidade e termos.
  - [ ] Submeter release no Google Play Console.

---

## 6. Documentos de Referência no Projeto

- [ECOSYSTEM_WALKTHROUGH_ROADMAP.md](file:///c:/WillenWorks/PataNet/api/dev-docs/ECOSYSTEM_WALKTHROUGH_ROADMAP.md) — Roteiro completo de evolução.
- [ENVIRONMENT_SETUP_GUIDE.md](file:///c:/WillenWorks/PataNet/api/dev-docs/ENVIRONMENT_SETUP_GUIDE.md) — Guia de configuração do ambiente.
- [TEST_ACCOUNTS.md](file:///c:/WillenWorks/PataNet/api/dev-docs/TEST_ACCOUNTS.md) — Matriz completa de contas de teste e senhas (`Patanet@Dev2026!`).
- [TEST_SUITE_CATALOG.md](file:///c:/WillenWorks/PataNet/api/dev-docs/TEST_SUITE_CATALOG.md) — Catálogo detalhado de todas as 92+ suites de teste do ecossistema.
- [PROMPT_E2E_BATTERIES_EXECUTION.md](file:///c:/WillenWorks/PataNet/api/dev-docs/PROMPT_E2E_BATTERIES_EXECUTION.md) — Prompts de automação para os agentes executarem as 14 baterias de teste.
- [swagger.json](file:///c:/WillenWorks/PataNet/api/docs/swagger.json) — Contrato OpenAPI com as rotas do backend.

