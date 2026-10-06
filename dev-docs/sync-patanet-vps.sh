#!/usr/bin/env bash
set -e

REPO_DIR="/root/patanet"
BRANCH="${1:-dev}"

echo "=== [PataNet Monorepo Sync e Deploy] ==="
echo "Data: $(date)"
echo "Branch alvo: $BRANCH"

# Carrega ambiente NVM e Node/pnpm
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$PATH:/root/.nvm/versions/node/v22.20.0/bin:/root/.local/share/pnpm"

# 1. Clonar ou atualizar monorepo
if [ ! -d "$REPO_DIR/.git" ]; then
    echo "--> Clonando monorepo PataNet pela primeira vez..."
    git clone -b "$BRANCH" https://github.com/Willen-Leolatto/patanet.git "$REPO_DIR"
else
    echo "--> Atualizando monorepo existente..."
    cd "$REPO_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
fi

# 2. Configurar ambiente de producao da API
echo "--> Sincronizando variaveis de ambiente (.env)..."
if [ ! -f "$REPO_DIR/api/.env" ] && [ -f "/root/api/.env" ]; then
    cp /root/api/.env "$REPO_DIR/api/.env"
    echo "--> .env de producao copiado com sucesso."
fi

# 3. Build e Migracao da API
cd "$REPO_DIR/api"
echo "--> Instalando dependencias da API..."
pnpm install --frozen-lockfile || pnpm install

echo "--> Compilando NestJS..."
pnpm build

# 4. Atualizar processo PM2
echo "--> Recarregando PM2 nestjs-app..."
pm2 stop nestjs-app 2>/dev/null || true
pm2 delete nestjs-app 2>/dev/null || true
pm2 start dist/src/main.js --name "nestjs-app" --cwd "$REPO_DIR/api"
pm2 save

echo "=== Deploy concluido com sucesso! ==="
pm2 status nestjs-app
