# PataNet — Monorepo Oficial

Repositório unificado do ecossistema **PataNet** (PetEasy), englobando o backend NestJS, a aplicação frontend web/mobile (React / Vite / Capacitor) e o microsserviço de visão computacional e biometria animal com IA.

---

## 🏗️ Arquitetura do Monorepo

```
patanet/
├── api/          # Backend NestJS (Clean Architecture, Prisma ORM, PostgreSQL)
├── app/          # Frontend React + Vite + Capacitor (Android / PWA)
├── vision/       # Microsserviço Python FastAPI (YOLOv8, CLIP, FAISS, Gemini VLM)
├── dev-docs/     # Guias operacionais, testes e arquitetura
├── keys/         # Keystores de release e chaves do ecossistema
├── backups/      # Dumps locais e backups de bundles legados
└── docker-compose.yml # Orquestração local completa (PostgreSQL, MinIO, API, Vision)
```

---

## 🚀 Como Iniciar Localmente

### 1. Pré-Requisitos
- **Node.js**: `v20.x` ou `v22.x` (com `pnpm v9+`)
- **Docker Desktop** (com Docker Compose)
- **Python**: `3.11.x`

### 2. Subir Infraestrutura Mínima (PostgreSQL & MinIO)
```bash
docker-compose up -d postgres minio
```

### 3. Rodar a API Backend
```bash
cd api
pnpm install
pnpm prisma:migrate:deploy
pnpm start:dev
```
Acesse a documentação Swagger em: `http://localhost:3001/api/docs`.

### 4. Rodar o Frontend
```bash
cd app
pnpm install
pnpm dev
```
Acesse em: `http://localhost:5173`.

---

## 📖 Documentação e Guias de Operação

- 📌 **[Guia de Autenticação e Deploy na VPS](dev-docs/GITHUB_AUTH_AND_VPS_DEPLOY_COMMANDS.md):** Comandos exatos para autenticar o GitHub e sincronizar com a VPS Hostinger (`72.60.245.7`).
- 📌 **[Setup de Novo Ambiente](dev-docs/ENVIRONMENT_SETUP_GUIDE.md):** Passo a passo completo para novas máquinas de desenvolvimento.
- 📌 **[Roadmap do Ecossistema](dev-docs/ECOSYSTEM_WALKTHROUGH_ROADMAP.md):** Histórico de evolução e fases de homologação.
- 📌 **[Catálogo de Testes E2E](dev-docs/TEST_SUITE_CATALOG.md):** Especificação das 14 baterias de teste.
- 📌 **[Script de Deploy da VPS](dev-docs/sync-patanet-vps.sh):** Script de sincronização automatizada do servidor.
