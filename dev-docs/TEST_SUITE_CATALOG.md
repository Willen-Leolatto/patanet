# Catálogo Completo da Suíte de Testes — PataNet

> **Visão Geral da Garantia da Qualidade (QA):**  
> O ecossistema PataNet adota a pirâmide de testes completa, combinando testes unitários rápidos de use cases e entidades de domínio, testes de integração de persistência com Prisma, testes End-to-End (E2E) com PostgreSQL real, testes de componentes frontend com Vitest e testes de pipeline de visão computacional com Pytest.

---

## 1. Resumo Executivo das Suítes

| Subsistema | Tipo de Teste | Framework | Quantidade | Status Atual |
|---|---|---|:---:|:---:|
| **Backend (`api/`)** | Testes Unitários de Casos de Uso e Domínio | Jest / ts-jest | **91 suites / 278 testes** | **100% Verde (278 passing)** |
| **Backend (`api/`)** | Testes End-to-End (E2E) com Banco Real | Jest / Supertest | **8 suites / 108 testes** | **100% Verde (108 passing)** |
| **Backend (`api/`)** | Testes de Integração de Repositórios Prisma | Jest / Prisma | **44 testes** | **100% Verde** |
| **Frontend (`app/`)** | Testes de Utilitários e Lógica de Componentes | Vitest | **2 suites / 10 testes** | **100% Verde (10 passing)** |
| **Vision (`vision/`)** | Testes de Pipeline Biométrico e Detecção | Pytest | **18 testes** | **100% Verde (18 passing)** |

---

## 2. Backend API: Detalhamento dos Testes Unitários (91 Suítes / 278 Testes)

Para executar todos os testes unitários do backend:
```bash
cd c:\WillenWorks\PataNet\api
pnpm run test
```

### Distribuição por Módulo e Domínio:

#### A. Módulo Usuários & Autenticação (`src/modules/users` e `src/modules/auth`):
- `create-user.use-case.spec.ts`: Criação de conta, validação de unicidade de e-mail e username, hash de senha.
- `find-user-by-id.use-case.spec.ts`: Busca de usuário por ID com retorno de DTO público.
- `find-users.use-case.spec.ts`: Listagem paginada de usuários.
- `update-user.use-case.spec.ts`: Atualização de perfil, bio, fotos e validações.
- `update-password.use-case.spec.ts`: Alteração de senha exigindo validação prévia da senha atual.
- `delete-user.use-case.spec.ts`: Exclusão de conta (purge de dados pessoais e realocação de posts para usuário sentinela).
- `sign-in.use-case.spec.ts`: Autenticação por e-mail/senha, bloqueio de contas inativas (HTTP 401).
- `refresh-token.use-case.spec.ts`: Renovação de sessão via refresh token JWT.

#### B. Módulo Animais & Saúde (`src/modules/animals`):
- `create-animal.use-case.spec.ts`: Cadastro de pet com raça, peso e porte; tutoria principal automática.
- `get-animal-by-id.use-case.spec.ts`: Visualização completa do pet com validação de visibilidade.
- `update-animal.use-case.spec.ts`: Edição de dados do pet restrita a tutores autorizados.
- `delete-animal.use-case.spec.ts`: Remoção de pet e cascateamento de registros médicos.
- `add-tutor.use-case.spec.ts`, `remove-tutor.use-case.spec.ts`, `transfer-primary-tutor.use-case.spec.ts`: Gestão colaborativa de co-tutores.
- `toggle-visibility.use-case.spec.ts`: Controle de privacidade da listagem pública do pet.
- `create-vaccine.use-case.spec.ts`, `update-vaccine.use-case.spec.ts`, `delete-vaccine.use-case.spec.ts`: Carteira de vacinação com tags oficiais.
- `create-medication.use-case.spec.ts`, `create-deworming.use-case.spec.ts`: Controle parasitário e tratamentos contínuos.
- `get-species.use-case.spec.ts`, `get-breeds.use-case.spec.ts`: Catálogo descritivo oficial de espécies e raças.

#### C. Módulo Petshops, Veterinários & Adoção Responsável:
- `create-adoption-request.use-case.spec.ts`: Candidatura de adoção responsável para pets de parceiros.
- `reject-adoption-request.use-case.spec.ts`: Rejeição de candidatura com justificativa.
- `transfer-pet-custody.use-case.spec.ts`: Transação atômica em 3 tabelas transferindo titularidade da PJ para o tutor adotante com emissão do Termo Digital de Adoção.
- `attend-event.use-case.spec.ts`: Inscrição atômica em eventos comunitários e feiras de adoção.
- `cancel-event-attendance.use-case.spec.ts`: Cancelamento de presença e promoção automática do 1º colocado da fila `WAITLIST`.

#### D. Módulo Posts, Feed & Moderação (`src/modules/posts`, `blocks`, `reports`, `support`):
- `create-post.use-case.spec.ts`, `update-post.use-case.spec.ts`, `delete-post.use-case.spec.ts`: Publicações com legendas e fotos validadas contra magic bytes.
- `get-feed.use-case.spec.ts`: Feed social cronológico com aplicação estrita do filtro SQL `NOT IN` de usuários mutuamente bloqueados.
- `toggle-like.use-case.spec.ts`, `create-comment.use-case.spec.ts`: Curtidas e comentários com aninhamento.
- `block-user.use-case.spec.ts`, `unblock-user.use-case.spec.ts`, `list-blocks.use-case.spec.ts`: Bloqueio bilateral de perfis.
- `create-report.use-case.spec.ts`, `update-report-status.use-case.spec.ts`: Canal de denúncias estruturado e despacho para órgãos públicos.
- `create-ticket.use-case.spec.ts`, `send-message.use-case.spec.ts`: Sistema de suporte ao usuário com threads.

---

## 3. Backend API: Detalhamento dos Testes E2E (8 Suítes / 108 Testes)

Os testes End-to-End validam os controllers, guards, pipes, filtros de exceção e a camada de persistência Prisma contra o container isolado `api-postgres-test-1` (porta 5433).

Para rodar todos os testes E2E com isolamento `--runInBand`:
```bash
cd c:\WillenWorks\PataNet\api
pnpm run test:e2e
```

### Especificações E2E:
1. `auth.e2e-spec.ts`: Cadastro de novo usuário, login com JWT, refresh token, login com senha incorreta e bloqueio de contas inativas.
2. `users.e2e-spec.ts`: Perfil do usuário, aceite de termos LGPD (`POST /users/terms/accept`), exclusão de conta in-app (`DELETE /users/me`) e rota pública Play Store (`POST /delete-account`).
3. `posts.e2e-spec.ts`: Criação de posts com uploads, curtidas, comentários raiz e aninhados, e verificação do filtro de bloqueios no feed.
4. `events.e2e-spec.ts`: Criação de eventos oficiais, controle atômico de capacidade de público, geração de status `WAITLIST` e cancelamento com promoção automática de inscritos.
5. `connections.e2e-spec.ts`: Seguir usuário, deixar de seguir, contadores de seguidores e listagens paginadas.
6. `blocks.e2e-spec.ts`: Bloqueio mútuo entre usuários, desbloqueio e confirmação de isolamento de conteúdo.
7. `reports.e2e-spec.ts`: Envio de denúncia por usuários autenticados, triagem da moderação e alteração de status por administradores.
8. `support.e2e-spec.ts`: Abertura de ticket pelo usuário, troca de mensagens em thread e encerramento do atendimento pela administração.

---

## 4. Frontend App: Testes Vitest & Matriz de Aceitação Manual

Para rodar os testes automatizados do frontend:
```bash
cd c:\WillenWorks\PataNet\app
pnpm test
```

### Testes Automatizados (Vitest):
- `src/utils/cn.test.js`: Validação do helper de composição condicional de classes CSS Tailwind v4.
- `src/features/events/utils/eventDate.test.js`: Formatação de datas e horários de eventos, cálculo de status passado/futuro e badges de presença.

### Matriz de Testes Manuais & Critérios de Aceitação das Telas:

| Tela / Fluxo | Arquivo Principal | Critério de Aceitação Esperado |
|---|---|---|
| **Termos LGPD** | `TermsGateModal.jsx` | Bloqueia interação até o usuário clicar em "Aceitar Termos". Uma vez aceito, não volta a aparecer a menos que a versão seja incrementada. |
| **Presença em Eventos** | `EventDetail.jsx` | Se vagas disponíveis: botão verde "Garantir Vaga". Se lotado: botão amarelo "Entrar na Lista de Espera" com posição na fila `WAITLIST`. |
| **Adoção Responsável** | `PetsAdoptable.jsx` + `AdoptionTermModal.jsx` | Listagem apenas de pets com `isForAdoption: true`. Botão "Quero Adotar" abre modal com histórico de vacinas e assinatura obrigatória do Termo Digital. |
| **Carteira de Saúde** | `PetDetail.jsx` | Vacinas cadastradas com CRMV exibem selo visual verde "Validado por Médico Veterinário" com CRMV/UF e lote. |
| **"Avistei um Pet" (No-Login)** | `SightingReport.jsx` | Acessível publicamente sem login em `/avistei-um-pet`. Gravação de vídeo de até 15s, geolocalização capturada pelo GPS do dispositivo e envio direto para a IA de visão. |
| **Exclusão de Conta (Play Store)** | `AccountDeletion.jsx` + `UserEdit.jsx` | Exige confirmação explícita digitando "EXCLUIR". Após confirmação, desloga imediatamente e remove todos os dados pessoais do titular. |

---

## 5. PataNet Vision: Testes de IA & Biometria (18 Testes Pytest)

Para rodar a suíte de testes do PataNet Vision:
```bash
cd c:\WillenWorks\PataNet\vision
.venv\Scripts\activate
pytest tests/
```

### Cenários Cobertos:
- `test_frame_extraction.py`: Seleção dos top-5 frames mais nítidos via variância Laplaciana em vídeos curtos (<=15s).
- `test_hsv_filter.py`: Isolamento cromático de lama, poeira e sangue para preservar a cor genética da pelagem.
- `test_abuse_detector.py`: Reconhecimento de desnutrição extrema (BCS), lacerações abertas e coleiras incrustadas, ativando `abuse_suspected: true`.
- `test_endpoints.py`: Contrato REST de `/internal/sync/pet` e `/internal/sightings/analyze`.
