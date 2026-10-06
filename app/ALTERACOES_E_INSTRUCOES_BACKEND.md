# Relatório técnico — Alterações no Front-end (PataNet)

**Data:** 2026-02-17\
**Escopo:** mudanças implementadas no front-end para Eventos como post no feed, busca de perfis e tutoria (owners), item de menu “Canal de Denúncia”, e replicação da área de Vacinas para Vermifugação e Medicamentos.
---

## 1) Visão geral da versão

### 1.1 Eventos

- Páginas de **listar eventos**, **criar evento** e **detalhe do evento**.
- Integração com o **feed**: quando um post vier com vínculo de evento, ele ganha um **card destacado** e link para a página do evento.

### 1.2 Perfis + busca

- Página de listagem de usuários (`/usuarios`) já existia em forma de esboço e foi consolidada/ajustada para busca/UX.

### 1.3 Tutoria (owners) de pets

- Na tela do pet (`/pets/:id`), inclusão de seção **Tutores**.
- Modal para buscar perfis e vincular como tutor.
- Integração com endpoints existentes de owner.

### 1.4 Canal de Denúncia

- Novo item de menu abrindo link externo: `https://patanet.app.br/denuncia`.

### 1.5 Carteira de saúde — Vermifugação e Medicamentos

- Replicação completa do padrão de **Vacinas** (accordion + cards + modais + ações) para:
  - **Vermifugação**
  - **Medicamentos**

---

## 2) Arquivos alterados/criados (front-end)

### 2.1 Rotas

**Arquivo:** `src/routes.jsx`

- Adicionadas rotas:
  - `/eventos` → listagem
  - `/eventos/novo` → criação
  - `/eventos/:eventId` → detalhe

### 2.2 APIs (módulos de acesso HTTP)

**Padrão atual do projeto:** usar `http` de `src/api/axios.js` (com tokens/interceptors).

#### 2.2.1 Eventos

**Arquivo criado/corrigido:** `src/api/events.api.js`

- Implementado com `FormData` para permitir `image`.
- Funções:
  - `fetchEvents({ page, perPage })` → `GET /events`
  - `fetchEventById(eventId)` → `GET /events/:id`
  - `createEvent(payload)` → `POST /events` (multipart/form-data)
  - `updateEvent(eventId, payload)` → `PUT /events/:id` (multipart/form-data)
  - `deleteEvent(eventId)` → `DELETE /events/:id`

#### 2.2.2 Vermifugação

**Arquivo criado:** `src/api/deworming.api.js`

- Funções:
  - `addDeworming({ animalId, name, observations, clinic, appliedAt, nextDose })`
  - `fetchDewormings({ animalId, page, perPage })`
  - `updateDeworming({ animalId, dewormingId, name, observations, clinic, appliedAt, nextDose })`
  - `deleteDeworming({ animalId, dewormingId })`

#### 2.2.3 Medicamentos

**Arquivo criado:** `src/api/medications.api.js`

- Funções:
  - `addMedication({ animalId, name, startAt, endAt, dosage, frequency, clinic, observations })`
  - `fetchMedications({ animalId, page, perPage })`
  - `updateMedication({ animalId, medicationId, name, startAt, endAt, dosage, frequency, clinic, observations })`
  - `deleteMedication({ animalId, medicationId })`

#### 2.2.4 Export barrel

**Arquivo alterado:** `src/api/index.js`

- Exporta também:
  - `./deworming.api.js`
  - `./medications.api.js`

### 2.3 Eventos (UI)

**Arquivos criados:**

- `src/features/events/pages/EventsList.jsx`
- `src/features/events/pages/EventCreate.jsx`
- `src/features/events/pages/EventDetail.jsx`

### 2.4 Feed (integração de eventos)

**Arquivo alterado:** `src/features/feed/pages/Feed.jsx`

- Adicionados botões “Eventos” e “Criar evento”.
- Normalizador `normPost` passou a suportar campos de evento:
  - `post.isEvent`
  - `post.eventId`
  - `post.event` (objeto)
- Renderização de **card de evento** dentro do post quando houver vínculo.

### 2.5 Usuários (lista/busca)

**Arquivo alterado:** `src/features/users/pages/UsersList.jsx`

- Ajuste de UX no placeholder da busca para “Buscar por nome ou @username…”.

### 2.6 Pet detail — tutores + saúde

**Arquivo alterado:** `src/features/pets/pages/PetDetail.jsx`

- Seção **Tutores**:
  - Lista tutores atuais.
  - Ações: adicionar (modal) e remover (quando houver mais de 1 tutor).
  - Busca via endpoint de listagem de usuários.
- Carteira de saúde:
  - Mantém Vacinas.
  - Adiciona Vermifugação.
  - Adiciona Medicamentos.
  - Modais e ações CRUD espelhando Vacinas.

### 2.7 Menu — Canal de Denúncia

**Arquivo alterado:** `src/components/nav/SideBar.jsx`

- Adicionado item abrindo URL externa: `https://patanet.app.br/denuncia`
  - Desktop e mobile.

### 2.8 ESLint

**Arquivo alterado:** `eslint.config.js`

- Ignorado `dev-dist` (além de `dist`) para evitar erros de lint com arquivos gerados.

---

## 3) Instruções técnicas para o backend (contratos necessários)

> Abaixo estão os endpoints/payloads que o front consome e/ou espera. Onde existiam endpoints no projeto, o front já está apontando para eles. Onde não existiam, foi criado um módulo de API “stub” com **rotas sugeridas**.

### 3.1 Autenticação (contexto)

- O `http` (`src/api/axios.js`) injeta automaticamente:
  - `Authorization: Bearer <access_token>`
  - `refresh-token` (quando existir)
- Em 401, o front tenta `refresh()` e reexecuta a request.

### 3.2 Eventos

#### 3.2.1 Endpoints

- `GET /events?page=&perPage=`
- `GET /events/:id`
- `POST /events` (**multipart/form-data**)
- `PUT /events/:id` (**multipart/form-data**)
- `DELETE /events/:id`

#### 3.2.2 Payload (create/update)

No front, `createEvent(payload)` monta `FormData` com:

- `title` (string)
- `description` (string)
- `date` (string, recomendado `YYYY-MM-DD`)
- `time` (string, recomendado `HH:mm`)
- `locationText` (string | null)
- `latitude` (number | null) — reservado
- `longitude` (number | null) — reservado
- `image` (File | null)

#### 3.2.3 Integração com Feed (requisito principal)

**Recomendação forte:** ao criar um evento, o backend deve criar um **post** vinculado.

Para o front renderizar o card de evento no feed sem chamada extra, o ideal é que `GET /posts/feed` retorne, em cada post de evento:

- `eventId` (string) e/ou
- `event` (objeto mínimo)

**Objeto mínimo recomendado em** `post.event`**:**

- `id`
- `title`
- `description` (opcional)
- `date`
- `time`
- `locationText`
- `image` (string URL) ou `{ url }`

O front também detecta evento quando:

- `post.type === "EVENT"` (case-insensitive)
- `post.isEvent === true` ou `post.hasEvent === true`

> Se o backend retornar só `eventId`, o front ainda renderiza um card “clicável”, mas o conteúdo do card fica limitado. O ideal é retornar `event` junto.

---

### 3.3 Usuários (busca/lista)

#### 3.3.1 Endpoint

- `GET /users?query=&page=&perPage=`

#### 3.3.2 Retorno esperado

O `UsersList.jsx` aceita:

- `resp.data` como lista
- e opcionalmente `resp.pagination.pages` ou `resp.pagination.total`

Formato recomendado:

```json
{
  "data": [ { "id": "...", "username": "...", "name": "...", "image": "...", "imageCover": "..." } ],
  "pagination": { "page": 1, "pages": 10, "perPage": 12, "total": 120 }
}
```

---

### 3.4 Tutoria (owners) de pets

#### 3.4.1 Endpoints usados (já existentes no front)

- Vincular tutor ao pet:
  - `POST /animals/:animalId/owner/:ownerId`
- Remover tutor:
  - `DELETE /animals/:animalId/owner/:ownerId`

#### 3.4.2 Retorno do pet (para reduzir chamadas extras)

No `GET /animals/:animalId`, o front consegue operar com:

- `ownerId` (primário) e/ou
- `owners: [{ id }]` (lista)

Mas para evitar request extra por tutor, recomenda-se retornar:

- `owners: [{ id, username, name, image } ...]`

Se vier somente id, o front faz fallback em:

- `GET /users/:id`

---

### 3.5 Vacinas (já funcional)

#### 3.5.1 Endpoints atuais consumidos

**Arquivo:** `src/api/vaccines.api.js`

- `POST /animals/vaccines/:animalId`
- `GET /animals/vaccines/:animalId`
- `PATCH /animals/:animalId/vaccines/:vaccineId`
- `DELETE /animals/:animalId/vaccines/:vaccineId`

#### 3.5.2 Campos usados no front

O front normaliza aceitando:

- `name` (ou `vaccine`)
- `appliedAt` (ou `date`)
- `nextDose` (ou `nextDoseDate`)
- `clinic`
- `observations` (ou `notes`)

---

### 3.6 Vermifugação (novo)

#### 3.6.1 Endpoints sugeridos

**Arquivo:** `src/api/deworming.api.js`

- `POST /animals/dewormings/:animalId`
- `GET /animals/dewormings/:animalId`
- `PATCH /animals/:animalId/dewormings/:dewormingId`
- `DELETE /animals/:animalId/dewormings/:dewormingId`

#### 3.6.2 Payload (create/update)

```json
{
  "name": "Drontal",
  "appliedAt": "2026-02-17",
  "nextDose": "2026-05-17",
  "clinic": "Unifacvest Vet",
  "observations": "..."
}
```

#### 3.6.3 Retorno esperado

Lista em:

- `data` (preferencial)
- ou array direto
- ou `items`

Campos aceitos no item:

- `id`/`_id`
- `name` (ou `dewormer`/`vermifugo`)
- `appliedAt` (ou `date`)
- `nextDose` (ou `nextDoseDate`)
- `clinic`
- `observations` (ou `notes`)

---

### 3.7 Medicamentos (novo)

#### 3.7.1 Endpoints sugeridos

**Arquivo:** `src/api/medications.api.js`

- `POST /animals/medications/:animalId`
- `GET /animals/medications/:animalId`
- `PATCH /animals/:animalId/medications/:medicationId`
- `DELETE /animals/:animalId/medications/:medicationId`

#### 3.7.2 Payload (create/update)

```json
{
  "name": "Antibiótico",
  "startAt": "2026-02-17",
  "endAt": "2026-02-24",
  "dosage": "5ml",
  "frequency": "12/12h",
  "clinic": "Unifacvest Vet",
  "observations": "..."
}
```

#### 3.7.3 Retorno esperado

Lista em `data` (preferencial), array direto ou `items`.

Campos aceitos no item:

- `id`/`_id`
- `name` (ou `medication`/`medicamento`)
- `startAt` (ou `startDate` ou, como fallback, `appliedAt/date`)
- `endAt` (ou `endDate`)
- `dosage`
- `frequency` (ou `interval`)
- `clinic`
- `observations` (ou `notes`)

---

## 4) Observações de compatibilidade / cuidados

1. **Eventos no feed**

- O front já está pronto para mostrar um post como evento usando flags (`eventId/event/isEvent/type`).
- Recomendação: retornar `event` completo no feed para enriquecer o card.

2. **Tutores**

- O front impede remover o último tutor (garante pelo menos 1).
- Para melhor UX/performance, retornar `owners` com dados completos no endpoint do pet.

3. **Padrão visual**

- Vermifugação e Medicamentos foram construídos replicando:
  - estrutura do accordion,
  - card de item,
  - modal,
  - botões de ação (Hoje/Editar/Excluir),
  - padrões de classes (`bg-[var(--content-bg)]`, chips, ring, etc.).

4. **Datas**

- Inputs usam `YYYY-MM-DD`.
- Na listagem, exibição usa `toLocaleDateString("pt-BR")` e utilitários internos.

---

## 5) Checklist de implementação do backend

### Eventos

- [ ] Implementar endpoints REST `/events` conforme descrito.

- [ ] `POST /events` criar evento e também criar post vinculado.

- [ ] `GET /posts/feed` retornar evento vinculado no post (`eventId` e/ou `event`).

### Usuários

- [ ] `GET /users` aceitar `query`, `page`, `perPage`.

- [ ] Retornar `data` + `pagination` (recomendado).

### Tutores

- [ ] Garantir `POST/DELETE /animals/:animalId/owner/:ownerId`.

- [ ] No `GET /animals/:animalId`, retornar `owners` com dados completos (recomendado).

### Vermifugação

- [ ] Implementar endpoints sugeridos (ou ajustar o front caso use outra rota).

- [ ] Persistir e retornar campos `name`, `appliedAt`, `nextDose`, `clinic`, `observations`.

### Medicamentos

- [ ] Implementar endpoints sugeridos.

- [ ] Persistir e retornar `name`, `startAt`, `endAt`, `dosage`, `frequency`, `clinic`, `observations`.

---

## 6) Como testar (roteiro rápido)

1. **Eventos**

- Criar evento em `/eventos/novo`.
- Verificar se ao retornar ao feed, aparece um post “Evento” com card destacado.
- Abrir o post/ card e navegar para `/eventos/:eventId`.

2. **Tutores**

- Abrir um pet onde você é tutor.
- Em “Tutores” → “Adicionar” → buscar um perfil → “Vincular”.
- Verificar se `ownerIds`/`owners` atualiza e permite editar ações.

3. **Vermifugação/Medicamentos**

- Em “Carteira de Saúde”, validar:
  - accordions e layout iguais ao de Vacinas,
  - criar/editar/excluir,
  - badge de próxima dose (vermifugação).

---