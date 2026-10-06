# PataNet — Pendências e Implementações Backend (NestJS)

> **Última auditoria:** 2026-05-12

---

## Stack de Referência

- **Framework:** NestJS 11
- **ORM:** TypeORM
- **Banco de Dados:** MySQL
- **Storage:** AWS S3 (módulo de upload já presente no código)

---

## Status Geral por Feature

| Feature | Status |
|---|---|
| Módulo Veterinário (`/vet`) | ❌ Não iniciado |
| Upload S3 (integração com módulos) | ✅ Implementado (pendências menores) |
| Presença em Eventos (`/events/:id/attend`) | 🟡 Stub — não implementado |
| Aceite de Termos (`/auth/accept-terms`) | ❌ Não iniciado |
| Módulo Petshop (`/petshops`) | ❌ Não iniciado |
| Alinhamento de Contrato Frontend/Backend | 🟡 Parcial |
| Refatoração do Feed (`GET /posts/feed`) | 🟡 Parcial |

---

## 1. Funcionalidades para Finalizar (Em Andamento)

### 1.1 Módulo Veterinário (`/vet`)

**Status:** ❌ Não iniciado — nenhum módulo, entidade, controller ou referência ao papel `VET` foi encontrado no código-fonte.

**Escopo pendente:**
- Criar módulo `vet` seguindo a arquitetura hexagonal do projeto
- Endpoints de perfil veterinário (criação, edição, consulta)
- Associação entre usuário e perfil vet
- Listagem e busca de veterinários
- Lógica de negócio específica do papel `VET`

---

### 1.2 Módulo de Upload (Integração S3/AWS)

**Status:** ✅ Implementado — o adaptador `S3StorageAdapter` está funcional e integrado com todos os módulos que consomem mídia.

**O que está feito:**
- Upload de imagem para **Perfil de Usuário** (`image`, `imageCover`) com delete da imagem anterior ✅
- Upload de imagem para **Animals/Pets** (`image`, `imageCover`) ✅
- Upload de mídias para **Posts** (até 5 arquivos) ✅
- Upload de imagem para **Eventos** ✅
- Upload para mídias de animal (`animal-medias`) ✅
- Retorno de URL pública após upload ✅

**Pendências menores:**
- Validação de tipo e tamanho de arquivo não está implementada no adaptador `S3StorageAdapter` — qualquer arquivo é aceito sem restrição
- Sem tratamento explícito de erro de quota/falha no S3

---

## 2. Funcionalidades para Implementar do Zero

### 2.1 Presença em Eventos — `POST /events/:id/attend`

**Status:** 🟡 Stub presente — os endpoints existem no controller mas retornam `{ ok: false, message: 'Not implemented yet' }`. Nenhuma entidade, use case ou repositório de presença foi criado.

**O que existe:**
- `POST /events/:id/attend` → stub ❌
- `DELETE /events/:id/attend` → stub ❌
- `GET /events/:id/attendees` → **não existe** ❌

**Escopo pendente:**
- Criar entidade e tabela de presença (`EventAttendee`)
- Use cases: marcar presença, desmarcar presença, listar participantes
- Implementar os endpoints de stub com lógica real
- Adicionar `GET /events/:id/attendees`
- Regras: impedir presença duplicada, verificar se evento existe e está ativo

---

### 2.2 Aceite de Termos e Condições — `/auth/accept-terms`

**Status:** ❌ Não iniciado — nenhum endpoint, campo ou lógica relacionada foi encontrada.

**Verificado:**
- `UserOrmEntity` não possui campos `termsAcceptedAt` nem `termsVersion`
- `AuthController` não possui rota `POST /auth/accept-terms`
- Nenhum guard ou middleware de verificação de termos existe

**Escopo pendente:**
- Adicionar campos `termsAcceptedAt` e `termsVersion` na entidade `User` e migration correspondente
- `POST /auth/accept-terms` — registra o aceite com timestamp e versão
- Guard ou middleware para bloquear rotas protegidas se os termos não foram aceitos

---

### 2.3 Módulo Petshop

**Status:** ❌ Não iniciado — nenhuma referência ao módulo petshop encontrada no código.

**Escopo pendente:**
- Criar módulo `petshops` completo (module, controller, service, repository, DTOs, entities)
- CRUD completo de Petshops (`/petshops`)
- Associação de petshop a um usuário proprietário
- Listagem e busca (por localização, nome, serviços)
- Submódulo de serviços oferecidos

---

## 3. Dívidas Técnicas e Alinhamentos

### 3.1 Alinhamento de Contrato Frontend/Backend (Auth e Feed)

**Status:** 🟡 Parcialmente implementado.

**O que está feito:**
- `POST /auth/session` → funcional, retorna `accessToken` e `refreshToken` via `ResponseJwtDto` ✅
- `POST /auth/refresh` → funcional, lê `refresh-token` via header e retorna novos tokens ✅

**Pendências:**
- Contrato não está documentado formalmente (OpenAPI/Swagger)
- Verificar se o frontend está usando o header `refresh-token` corretamente (não `Authorization`)
- Revisar se campos retornados por `ResponseJwtDto` batem com o que o frontend espera

---

### 3.2 Refatoração e Validação do Feed (`GET /posts/feed`)

**Status:** 🟡 Funcional, mas incompleto.

**O que está feito:**
- `GET /posts/feed` implementado com paginação por offset ✅
- Filtra posts do próprio usuário + conexões seguidas ✅
- Paginação com metadados (`page`, `perPage`, `total`, `pages`) ✅

**Pendências:**
- Filtro de bloqueios (`/blocks`) **não é aplicado** na query do feed — usuários bloqueados aparecem no feed
- Paginação por offset pode ser problemática para feeds grandes (considerar cursor-based)
- Sem testes de integração para os cenários principais do feed

---

## Observações Gerais

- Siga o padrão de estrutura de módulos já existente no projeto (arquitetura hexagonal: `domain`, `application`, `infrastructure`, `presentation`)
- Utilize TypeORM com migrations para qualquer alteração no schema do banco
- Todos os endpoints protegidos devem usar o `AuthGuard` JWT já implementado
- DTOs devem usar `class-validator` para validação de entrada
- Respostas de erro devem seguir o padrão já adotado na API
