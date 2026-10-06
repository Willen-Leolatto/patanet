# PataNet API — build multi-stage (NestJS + Prisma) via pnpm.
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Pinado para casar com pnpm-lock.yaml (lockfileVersion 9.0). Corepack por
# padrão baixaria a última major do pnpm, que muda a política de scripts
# de build de dependências (onlyBuiltDependencies) o suficiente para
# quebrar o install em modo --frozen-lockfile.
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
# Prisma precisa do OpenSSL para detectar a engine correta em tempo de build/execução.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm run build

# Runtime: reaproveita o node_modules já instalado (com o Prisma Client
# gerado) em vez de reinstalar só as dependências de produção — o layout de
# symlinks do pnpm (.pnpm store) torna copiar apenas um subconjunto do
# node_modules entre estágios frágil e específico de versão.
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/src/main"]
