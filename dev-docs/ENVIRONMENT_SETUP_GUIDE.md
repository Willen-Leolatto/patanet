# Guia de Configuração e Instalação de Novo Ambiente — PataNet

> **Finalidade deste Guia:**  
> Ao trocar de computador, reinstalar o sistema ou subir o ecossistema PataNet em uma nova máquina de desenvolvimento, siga este passo a passo sequencial para ter toda a infraestrutura, bancos de dados, API, frontend e visão computacional rodando em minutos.

---

## 1. Pré-Requisitos de Software

Instale os seguintes componentes na máquina antes de começar:

1. **Git:** `2.40+`
2. **Node.js:** `v20.x` ou `v22.x` (LTS)
3. **pnpm:** `v9.x` (Instalar via `npm install -g pnpm@9` ou `corepack enable`)
4. **Docker Desktop:** Versão atual com Docker Compose e suporte a Linux Containers ativo.
5. **Python:** `3.11.x` (com `pip` e `venv` adicionados ao PATH).

---

## 2. Mapa de Portas e Alocação de Rede Local

Para evitar conflitos com outros projetos locais (ex: containers comuns na porta 5432), o PataNet utiliza a seguinte alocação padronizada:

| Serviço | Porta Local | Container / Processo | Finalidade |
|---|---|---|---|
| **PostgreSQL Dev** | `5434` | `api-postgres-1` | Banco de desenvolvimento principal (`patanet_dev`) |
| **PostgreSQL Test** | `5433` | `api-postgres-test-1` | Banco isolado para execução de testes E2E (`patanet_test`) |
| **MinIO S3 API** | `9000` | `minio` | Armazenamento local de fotos e documentos compatível com AWS S3 |
| **MinIO Web Console** | `9001` | `minio` | Painel web para inspecionar buckets e uploads (`admin` / `minioadmin`) |
| **Backend NestJS API** | `3001` | Node.js (`pnpm run start:dev`) | API REST principal (`http://localhost:3001/api/docs`) |
| **Frontend React / Vite** | `5173` | Vite Dev Server (`pnpm run dev`) | Interface web e mobile Android via Capacitor |
| **PataNet Vision IA** | `8000` | FastAPI / Uvicorn | Microsserviço de biometria animal e laudos multimodais |

---

## 3. Passo a Passo de Instalação do Zero

### Passo 1: Clonar os Repositórios
No terminal (PowerShell ou Bash):

```bash
mkdir -p c:\WillenWorks
cd c:\WillenWorks

# Clonar o monorepo / repositórios
git clone -b dev https://github.com/Patanet-PetEasy/api.git c:\WillenWorks\PataNet\api
git clone -b dev https://github.com/Patanet-PetEasy/app.git c:\WillenWorks\PataNet\app
git clone https://github.com/Willen-Leolatto/patanet-vision.git c:\WillenWorks\PataNet\vision
```

---

### Passo 2: Configuração dos Arquivos de Ambiente (`.env`)

#### A. Backend (`api/.env`):
Copie o exemplo e confirme as variáveis:
```bash
cd c:\WillenWorks\PataNet\api
cp .env.example .env
```
Verifique se `DATABASE_URL` aponta para a porta **5434**:
```ini
NODE_ENV=development
APP_PORT=3001
DATABASE_URL="postgresql://postgres:docker@localhost:5434/patanet_dev?schema=public"
JWT_SECRET=vLtVzICd/Alc4RurUgJaZj7kCsHZ8VfH+Nm6F+fDqqPilsF+2egXp1Ev2Au25+cY3auOuLdhAyoWRysS4dyLqg==
JWT_EXPIRATION=7d
AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_BUCKET_NAME=patanet
ADMIN_EMAILS="dev.patanet@gmail.com"
REPORT_FORWARDING_EMAIL="dev.patanet@gmail.com"
PLAY_STORE_ACCOUNT_DELETION_URL="https://patanet.app.br/delete-account"
```

#### B. Backend Testes E2E (`api/.env.test`):
```ini
NODE_ENV=test
APP_PORT=3002
DATABASE_URL="postgresql://postgres:docker@localhost:5433/patanet_test?schema=public"
JWT_SECRET=test_jwt_secret_local_only
JWT_EXPIRATION=7d
AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_BUCKET_NAME=patanet-test
ADMIN_EMAILS="dev.patanet@gmail.com"
REPORT_FORWARDING_EMAIL="dev.patanet@gmail.com"
```

#### C. Frontend (`app/.env`):
```bash
cd c:\WillenWorks\PataNet\app
cp .env.example .env
```
```ini
VITE_API_BASE_URL=http://localhost:3001
VITE_VISION_API_URL=http://localhost:8000
```

#### D. PataNet Vision (`vision/.env`):
```bash
cd c:\WillenWorks\PataNet\vision
cp .env.example .env
```
```ini
API_HOST=0.0.0.0
API_PORT=8000
GEMINI_API_KEY=sua_chave_gemini_api_aqui
```

---

### Passo 3: Subir a Infraestrutura no Docker Desktop

No diretório `api/`:
```bash
cd c:\WillenWorks\PataNet\api

# Subir os containers de banco de dados e MinIO S3
docker-compose up -d postgres postgres-test minio

# Confirmar status dos containers
docker ps
```
*(Você verá `api-postgres-1` na 5434, `api-postgres-test-1` na 5433 e `minio` na 9000/9001).*

---

### Passo 4: Instalar Dependências e Migrar o Banco de Dados

```bash
cd c:\WillenWorks\PataNet\api

# 1. Instalar pacotes do NestJS
pnpm install

# 2. Gerar o cliente tipado do Prisma
pnpm run prisma:generate

# 3. Aplicar as migrações no banco dev (porta 5434)
pnpm run prisma:migrate:dev

# 4. Aplicar as migrações no banco test (porta 5433)
DATABASE_URL="postgresql://postgres:docker@localhost:5433/patanet_test?schema=public" npx prisma migrate deploy

# 5. Popular o banco com as contas e dados de teste
pnpm run db:seed
```

---

### Passo 5: Inicializar os 3 Subsistemas

Abra três abas no terminal (ou utilize o Windows Terminal):

#### Aba 1: Backend API (NestJS)
```bash
cd c:\WillenWorks\PataNet\api
pnpm run start:dev
```
> Acesse a documentação viva em: **`http://localhost:3001/api/docs`**

#### Aba 2: Frontend App (React / Vite / Capacitor)
```bash
cd c:\WillenWorks\PataNet\app
pnpm install
pnpm run dev
```
> Acesse a interface web em: **`http://localhost:5173`**  
> Para sincronizar o app Android: `pnpm cap sync android`

#### Aba 3: PataNet Vision (FastAPI IA)
```bash
cd c:\WillenWorks\PataNet\vision
python -m venv .venv

# Windows PowerShell:
.venv\Scripts\activate

# Instalar dependências leves de desenvolvimento ou completas
pip install -r requirements.txt

# Iniciar o servidor de visão computacional
uvicorn app.main:app --port 8000 --reload
```
> Acesse os endpoints em: **`http://localhost:8000/health`**

---

## 4. Comandos Úteis e Solução de Problemas (Troubleshooting)

### Como rodar todos os testes automatizados:
```bash
# Na pasta api:
pnpm run test        # 278 testes unitários (100% verde)
pnpm run test:e2e    # 108 testes E2E isolados (100% verde)

# Na pasta app:
pnpm test            # 10 testes Vitest

# Na pasta vision:
pytest tests/        # 18 testes Pytest
```

### Como abrir a interface gráfica do banco (Prisma Studio):
```bash
cd c:\WillenWorks\PataNet\api
npx prisma studio --port 5555
```
> Acesse em: `http://localhost:5555`

### Como resetar o banco de desenvolvimento do zero:
```bash
cd c:\WillenWorks\PataNet\api
npx prisma migrate reset --force
pnpm run db:seed
```
