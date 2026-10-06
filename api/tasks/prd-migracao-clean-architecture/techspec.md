# Tech Spec — Migração para Clean Architecture + DDD + Hexagonal

## Resumo Executivo

A migração reorganiza todos os módulos da API Patanet (NestJS + TypeORM + MySQL) aplicando Clean Architecture, DDD e Arquitetura Hexagonal de forma incremental, módulo a módulo, sem quebrar nenhum contrato de API existente. A estratégia central é mover o `src/core/` (Entity, AggregateRoot, ValueObject, UniqueEntityID, WatchedList, DomainEvents) para `src/shared/domain/`, criar um `SharedModule` global com `HashingPort` e `StoragePort`, e em seguida migrar cada módulo de negócio na ordem: Users → Auth → Animals → Posts → Events → Connections → Blocks → Reports → Support. Cada módulo migrado tem sua camada de domínio, application (use cases), infraestrutura e apresentação desacopladas, com cobertura de testes unit + integration + E2E ao final da etapa.

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

**Novos / Modificados:**

- `src/shared/domain/` — base classes DDD movidas de `src/core/`: `Entity<Props>`, `AggregateRoot<Props>`, `ValueObject<Props>`, `UniqueEntityID`, `WatchedList<T>`, infraestrutura de `DomainEvents` (mantida, sem uso ativo nesta migração)
- `src/shared/application/ports/` — `HashingPort` (renomeado de `HashingService`) e `StoragePort` (novo, extraído de `UploadService`)
- `src/shared/infrastructure/` — `BcryptHashingAdapter` (renomeado de `BcryptHashingService`) e `S3StorageAdapter` (extraído de `UploadService`)
- `src/shared/shared.module.ts` — módulo global que exporta `HashingPort` e `StoragePort`
- `src/modules/users/` — módulo Users migrado: domain entity `User`, `UserRepository` port, `TypeOrmUserRepository`, 5 use cases, `UsersModule` com bindings
- `src/modules/auth/` — módulo Auth migrado: `TokenGeneratorPort`, `JwtTokenGeneratorAdapter`, 2 use cases (`SignIn`, `RefreshToken`)
- `src/modules/animals/` — módulo Animals migrado: domain entities (`Animal`, `Vaccine`, `Deworming`, `Medication`), `TutorManagementDomainService`, 13+ use cases
- `src/modules/posts/` — módulo Posts migrado: domain entities (`Post`, `Comment`, `Like`, `Media`), 8 use cases
- `src/modules/events/` — módulo Events migrado: domain entity `Event`, 5 use cases
- `src/modules/connections/` — módulo Connections migrado: domain entity `Connection`, 4 use cases
- `src/modules/blocks/` — módulo Blocks migrado: domain entity `Block`, 3 use cases
- `src/modules/reports/` — módulo Reports migrado: domain entity `Report`, 3 use cases
- `src/modules/support/` — módulo Support migrado: domain entities `SupportTicket` + `SupportTicketMessage`, 5 use cases
- `test/` — estrutura de testes criada do zero: helpers, jest configs para unit/integration/E2E
- `docker-compose.yml` — adicionado serviço `mysql-test` com banco `patanet_test`

**Mantidos sem alteração:**
- `src/env/` — `EnvService`, `env.ts`, `env.module.ts`
- Todas as migrations em `src/migrations/`
- Schema do banco de dados (nenhuma migration nova)
- Todos os contratos de API (URLs, métodos, payloads, status HTTP)

**Removidos após migração:**
- `src/users/`, `src/auth/`, `src/animals/`, `src/posts/`, `src/events/`, `src/connections/`, `src/blocks/`, `src/reports/`, `src/support/`
- `src/upload/` (substituído por `StoragePort` + `S3StorageAdapter`)
- `src/common/hashing/` (substituído por `HashingPort` + `BcryptHashingAdapter`)
- `src/core/` (conteúdo movido para `src/shared/domain/`)

---

## Design de Implementação

### Interfaces Principais

**HashingPort (shared)**
```typescript
// src/shared/application/ports/hashing.port.ts
export abstract class HashingPort {
  abstract hash(password: string): Promise<string>
  abstract compare(password: string, hash: string): Promise<boolean>
}
```

**StoragePort (shared)**
```typescript
// src/shared/application/ports/storage.port.ts
export abstract class StoragePort {
  abstract upload(file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<{ url: string }>
  abstract delete(url: string): Promise<void>
}
```

**UserRepository (port)**
```typescript
// src/modules/users/domain/repositories/user.repository.ts
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByEmail(email: string): Promise<User | null>
  abstract findByUsername(username: string): Promise<User | null>
  abstract findMany(params: { query?: string; page: number; perPage: number }): Promise<{ items: User[]; total: number }>
  abstract save(user: User): Promise<void>
  abstract delete(id: string): Promise<void>
}
```

**Use Case (padrão aplicado a todos os módulos)**
```typescript
// src/modules/users/application/use-cases/create-user.use-case.ts
export interface CreateUserInput { name: string; username: string; email: string; password: string; image?: string | null }

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository, private readonly hashingPort: HashingPort) {}
  async execute(input: CreateUserInput): Promise<User> { /* ... */ }
}
```

**TokenGeneratorPort (auth)**
```typescript
// src/modules/auth/application/ports/token-generator.port.ts
export abstract class TokenGeneratorPort {
  abstract generateAccessToken(payload: { sub: string }): Promise<string>
  abstract generateRefreshToken(payload: { sub: string }): Promise<string>
  abstract verifyRefreshToken(token: string): Promise<{ sub: string }>
}
```

**AnimalRepository (port)**
```typescript
// src/modules/animals/domain/repositories/animal.repository.ts
export abstract class AnimalRepository {
  abstract findById(id: string): Promise<Animal | null>
  abstract findByOwner(ownerId: string, params: { query?: string; page: number; perPage: number }): Promise<{ items: Animal[]; total: number }>
  abstract save(animal: Animal): Promise<void>
  abstract delete(id: string): Promise<void>
  abstract addOwner(animalId: string, userId: string): Promise<void>
  abstract removeOwner(animalId: string, userId: string): Promise<void>
}
```

### Modelos de Dados

**Entidades de domínio — padrão comum (usando base classes do shared/domain):**

```typescript
// src/modules/users/domain/entities/user.ts
import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface UserProps {
  name: string; displayName: string | null; about: string | null
  image: string | null; imageCover: string | null
  username: string; email: string; password: string
  createdAt: Date; updatedAt: Date
}

export class User extends Entity<UserProps> {
  get name() { return this.props.name }
  get email() { return this.props.email }
  // ... demais getters

  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>, id?: UniqueEntityID): User {
    return new User({ ...props, createdAt: new Date(), updatedAt: new Date() }, id)
  }

  changePassword(newHashedPassword: string): void {
    this.props.password = newHashedPassword
    this.props.updatedAt = new Date()
  }

  updateProfile(data: Partial<Pick<UserProps, 'name' | 'displayName' | 'about' | 'image' | 'imageCover' | 'username' | 'email'>>): void {
    Object.assign(this.props, data)
    this.props.updatedAt = new Date()
  }
}
```

**Aggregate Animal** usa `AggregateRoot<AnimalProps>` e mantém lista de `ownerIds` como `WatchedList<string>`. Métodos de domínio: `addOwner`, `removeOwner`, `transferPrimary`, `toggleVisibility`.

**ORM Entities** permanecem com os mesmos decorators TypeORM mas movidas para `src/modules/{module}/infrastructure/persistence/typeorm/entities/*.orm-entity.ts`. **Nenhuma coluna nova ou alteração de schema.**

**Mappers** para cada módulo: `toDomain(orm)` e `toOrm(domain)`.

### Endpoints de API

Nenhum endpoint é alterado. Todos os contratos existentes são preservados integralmente:

| Módulo | Exemplos de endpoints mantidos |
|--------|-------------------------------|
| Auth | `POST /auth/session`, `POST /auth/refresh` |
| Users | `POST /users`, `GET /users`, `GET /users/me`, `GET /users/:id`, `PATCH /users`, `PATCH /users/password`, `DELETE /users`, `DELETE /users/:id` |
| Animals | `POST /animals`, `GET /animals/:id`, `PATCH /animals/:id`, `DELETE /animals/:id`, `GET /animals/owners/:id`, `POST /animals/:id/owners/:ownerId`, `DELETE /animals/:id/owners/:ownerId`, `PATCH /animals/:id/owners/:ownerId/primary` |
| Posts | `POST /posts`, `GET /posts/feed`, `PATCH /posts/:id`, `DELETE /posts/:id` |
| Events | `GET /events`, `POST /events`, `PATCH /events/:id`, `POST /events/:id/repost`, `DELETE /events/:id` |
| Connections | `POST /connections/follow/:id`, `DELETE /connections/unfollow/:id`, `GET /connections/followers/:id`, `GET /connections/following/:id` |
| Blocks | `POST /blocks/:id`, `DELETE /blocks/:id`, `GET /blocks` |
| Reports | `POST /reports`, `GET /reports/mine`, `PATCH /reports/:id/status` |
| Support | `POST /support`, `GET /support/mine`, `GET /support/all`, `POST /support/:id/messages`, `PATCH /support/:id/status` |

---

## Pontos de Integração

**AWS S3 / MinIO (StoragePort)**
- Implementado por `S3StorageAdapter` em `src/shared/infrastructure/storage/`
- Consome `EnvService` para `AWS_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`
- Usado pelos use cases que precisam de upload: `CreateUserUseCase`, `UpdateUserUseCase`, `CreateAnimalUseCase`, `UpdateAnimalUseCase`, `CreatePostUseCase`, `UpdatePostUseCase`, `CreateEventUseCase`, `UpdateEventUseCase`
- Tratamento de erro: falha no upload lança `InternalServerErrorException` no controller (não no use case)

**JWT (TokenGeneratorPort)**
- Implementado por `JwtTokenGeneratorAdapter` em `src/modules/auth/infrastructure/jwt/`
- Usa `@nestjs/jwt` com `JwtService` internamente
- `accessToken` expira em 1h, `refreshToken` em 1d (mantido igual ao atual)
- `refresh-token` ainda é lido do header `refresh-token` (comportamento mantido)

---

## Abordagem de Testes

### Testes Unitários

Estratégia de mock: instanciar use case diretamente com mocks de ports (sem NestJS DI).

- **Componentes a testar:** todos os use cases de todos os módulos, domain entities com comportamento (`Animal.addOwner`, `User.changePassword`, etc.), `TutorManagementDomainService`, mappers (`toDomain` / `toOrm`)
- **Mocks:** `UserRepository`, `HashingPort`, `StoragePort`, `TokenGeneratorPort` — apenas ports, nunca TypeORM diretamente
- **Cenários críticos:** happy path, `ConflictException` (email/username duplicado), `NotFoundException` (recurso não existe), `ForbiddenException` (não é tutor principal), `UnauthorizedException` (senha inválida)
- **Convenção de arquivo:** `*.spec.ts` em `src/modules/{module}/application/use-cases/`

### Testes de Integração

- **Componentes:** todas as implementações de repositório TypeORM (`TypeOrmUserRepository`, `TypeOrmAnimalRepository`, etc.)
- **Banco:** MySQL real na instância `patanet_test` (docker-compose)
- **Setup:** `synchronize: true` no módulo de teste (não afeta o banco de produção)
- **Dados de teste:** criados/limpos no `beforeEach` via `repository.delete({})`
- **Convenção de arquivo:** `*.integration.spec.ts`
- **Config:** `test/jest-integration.json`

### Testes de E2E

- **Framework:** Supertest + NestJS `Test.createTestingModule`
- **Banco:** MySQL real `patanet_test`
- **Fluxos cobertos:**
  - Auth: signup → login → acesso com token → refresh → acesso com token novo
  - Users: CRUD completo + troca de senha
  - Animals: criar pet → adicionar tutor → remover tutor → transferir tutor principal → excluir
  - Posts: criar → feed → curtir → comentar → editar → excluir
  - Events: criar → editar → repostar → excluir
  - Connections: seguir → listar → deixar de seguir
  - Blocks: bloquear → listar → desbloquear
  - Reports: criar → listar próprias → admin atualiza status
  - Support: abrir ticket → enviar mensagem → admin atualiza status
  - Controle de acesso: requisições sem token retornam 401, admin vs usuário comum
- **Helpers:** `test/e2e/helpers/app.helper.ts`, `auth.helper.ts`, `database.helper.ts`
- **Convenção de arquivo:** `*.e2e-spec.ts` em `test/e2e/`

---

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Etapa 0 — Preparação** *(sem alterar lógica de negócio)*
   - Mover `src/core/` → `src/shared/domain/` (Entity, AggregateRoot, ValueObject, UniqueEntityID, WatchedList, DomainEvents)
   - Criar `src/shared/application/ports/hashing.port.ts` e `storage.port.ts`
   - Criar `src/shared/infrastructure/hashing/bcrypt-hashing.adapter.ts` (renomear BcryptHashingService)
   - Criar `src/shared/infrastructure/storage/s3-storage.adapter.ts` (extrair de UploadService)
   - Criar `src/shared/shared.module.ts` com `@Global()`
   - Configurar path aliases no `tsconfig.json` (`@shared/*`, `@modules/*`)
   - Adicionar serviço `mysql-test` no `docker-compose.yml`
   - Criar `test/e2e/helpers/` (app.helper, auth.helper, database.helper)
   - Criar `test/jest-integration.json` e `test/jest-e2e.json`
   - Adicionar scripts `test:unit`, `test:integration`, `test:e2e`, `test:all` ao `package.json`
   - Validar: `npm run build` e `npm run lint` passando

2. **Etapa 1 — Users** *(primeiro módulo migrado, estabelece o padrão)*
   - Domain: `User` entity, `UserRepository` port
   - Infra: `UserOrmEntity`, `UserMapper`, `TypeOrmUserRepository`
   - Application: `CreateUserUseCase`, `UpdateUserUseCase`, `UpdatePasswordUseCase`, `DeleteUserUseCase`, `FindUsersUseCase`
   - Presentation: `UsersController` ajustado para chamar use cases; `StoragePort` injetado no controller para upload
   - Module: `UsersModule` com bindings
   - Testes: unit (todos os use cases), integration (`TypeOrmUserRepository`), E2E (`/users`)
   - Ao final: remover `src/users/`

3. **Etapa 2 — Auth** *(depende de Users migrado)*
   - Application ports: `TokenGeneratorPort`
   - Infra: `JwtTokenGeneratorAdapter`
   - Application: `SignInUseCase`, `RefreshTokenUseCase`
   - Presentation: `AuthController` ajustado
   - Module: `AuthModule` com bindings
   - Testes: unit, E2E (`/auth/session`, `/auth/refresh`)
   - Ao final: remover `src/auth/`

4. **Etapa 3 — Animals** *(maior módulo; depende de Users migrado para relação owners)*
   - Domain: `Animal` (AggregateRoot com `WatchedList<string>` para ownerIds), `Vaccine`, `Deworming`, `Medication`, `AnimalMedia`
   - Value objects: `AnimalSize`, `AnimalGender`
   - Domain service: `TutorManagementDomainService`
   - Repository ports: `AnimalRepository`, `VaccineRepository`, `DewormingRepository`, `MedicationRepository`, `AnimalMediaRepository`, `AnimalVisibilityRepository`, `BreedRepository`, `SpecieRepository`
   - Infra: ORM entities + mappers + TypeOrm repository implementations para cada port
   - Use cases: `CreateAnimalUseCase`, `UpdateAnimalUseCase`, `DeleteAnimalUseCase`, `AddTutorUseCase`, `RemoveTutorUseCase`, `TransferPrimaryTutorUseCase`, `ToggleVisibilityUseCase`, `CreateVaccineUseCase`, `UpdateVaccineUseCase`, `DeleteVaccineUseCase`, `CreateDewormingUseCase`, `UpdateDewormingUseCase`, `DeleteDewormingUseCase`, `CreateMedicationUseCase`, `UpdateMedicationUseCase`, `DeleteMedicationUseCase`, `GetAnimalsByOwnerUseCase`, `GetAnimalMediasUseCase`, `AddAnimalMediaUseCase`, `DeleteAnimalMediaUseCase`, `GetBreedsUseCase`, `GetSpeciesUseCase`
   - Testes: unit, integration, E2E
   - Ao final: remover `src/animals/`

5. **Etapa 4 — Posts** *(depende de Users e Animals)*
   - Domain: `Post` (AggregateRoot), `Comment`, `Like`, `Media`
   - Use cases: `CreatePostUseCase`, `UpdatePostUseCase`, `DeletePostUseCase`, `GetFeedUseCase`, `ToggleLikeUseCase`, `CreateCommentUseCase`, `UpdateCommentUseCase`, `DeleteCommentUseCase`
   - Testes: unit, integration, E2E
   - Ao final: remover `src/posts/`

6. **Etapa 5 — Events** *(depende de Posts migrado — Event tem Post vinculado)*
   - Domain: `Event` entity com regra de repostagem
   - Use cases: `CreateEventUseCase`, `UpdateEventUseCase`, `RepostEventUseCase`, `DeleteEventUseCase`, `ListEventsUseCase`
   - Testes: unit, integration, E2E
   - Ao final: remover `src/events/`

7. **Etapa 6 — Connections** *(simples, sem dependências complexas)*
   - Domain: `Connection` entity
   - Use cases: `FollowUseCase`, `UnfollowUseCase`, `ListFollowersUseCase`, `ListFollowingUseCase`
   - Ao final: remover `src/connections/`

8. **Etapa 7 — Blocks**
   - Domain: `Block` entity
   - Use cases: `BlockUserUseCase`, `UnblockUserUseCase`, `ListBlocksUseCase`
   - Ao final: remover `src/blocks/`

9. **Etapa 8 — Reports**
   - Domain: `Report` entity com enums `ReportStatus`, `ReportCategory`
   - Use cases: `CreateReportUseCase`, `ListMyReportsUseCase`, `UpdateReportStatusUseCase`
   - Ao final: remover `src/reports/`

10. **Etapa 9 — Support**
    - Domain: `SupportTicket` (AggregateRoot), `SupportTicketMessage`
    - Use cases: `CreateTicketUseCase`, `SendMessageUseCase`, `UpdateTicketStatusUseCase`, `ListMyTicketsUseCase`, `ListAllTicketsUseCase`
    - Ao final: remover `src/support/`

11. **Etapa 10 — Limpeza**
    - Remover `src/upload/` (substituído por StoragePort)
    - Remover `src/common/hashing/` (substituído por HashingPort)
    - Atualizar `data-source.ts` para referenciar os novos ORM entities em `src/modules/*/infrastructure/`
    - Revisar `app.module.ts` importando os novos módulos migrados
    - Validar cobertura ≥ 80% (`npm run test:cov`)
    - Validar `npm run build` e `npm run lint` sem erros

### Dependências Técnicas

- MySQL rodando localmente via docker-compose para testes integration e E2E
- `patanet_test` database criado via docker-compose (ver configuração abaixo)
- Path aliases `@shared/*` e `@modules/*` configurados no tsconfig para imports limpos

---

## Configurações Específicas

### docker-compose.yml — adição do banco de teste

```yaml
services:
  mysql:
    image: bitnami/mysql
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_USER=docker
      - MYSQL_ROOT_PASSWORD=docker
      - MYSQL_DATABASE=patanet

  mysql-test:
    image: bitnami/mysql
    ports:
      - "3307:3306"
    environment:
      - MYSQL_ROOT_USER=docker
      - MYSQL_ROOT_PASSWORD=docker
      - MYSQL_DATABASE=patanet_test
```

### tsconfig.json — path aliases

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@modules/*": ["src/modules/*"],
      "@core/*": ["src/shared/domain/*"]
    }
  }
}
```

### package.json — scripts de teste

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testRegex='.*\\.spec\\.ts$'",
    "test:integration": "jest --config ./test/jest-integration.json",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:cov": "jest --coverage",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

### test/jest-integration.json

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "../src",
  "testRegex": ".*\\.integration\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "moduleNameMapper": {
    "^@shared/(.*)$": "<rootDir>/shared/$1",
    "^@modules/(.*)$": "<rootDir>/modules/$1"
  }
}
```

### test/jest-e2e.json

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "testTimeout": 30000,
  "moduleNameMapper": {
    "^@shared/(.*)$": "<rootDir>/../src/shared/$1",
    "^@modules/(.*)$": "<rootDir>/../src/modules/$1"
  }
}
```

---

## Monitoramento e Observabilidade

Não há mudanças na infraestrutura de observabilidade nesta migração. O comportamento de logging do NestJS (via `Logger`) é mantido nos controllers e pode ser adicionado aos use cases conforme necessário. Nenhuma métrica Prometheus ou dashboard Grafana está no escopo desta migração.

---

## Considerações Técnicas

### Decisões Principais

**1. Reutilizar e mover `src/core/` para `src/shared/domain/`**
- Razão: o projeto já possui `Entity<Props>`, `AggregateRoot<Props>`, `ValueObject<Props>`, `UniqueEntityID` e `WatchedList<T>` prontos e testados. Reescrevê-los seria desperdício.
- Trade-off: as domain entities precisam de getters explícitos (ao invés de acesso direto a `props`), o que é ligeiramente mais verboso mas mantém encapsulamento.
- Alternativa rejeitada: plain classes com factory methods (como no `clean-ddd-hexagonal.md`) — menos encapsulamento e ignora código existente de valor.

**2. `abstract class` para ports (não `interface`)**
- Razão: NestJS DI usa tokens de injeção; `abstract class` serve como token sem necessidade de string token ou `InjectionToken` separado. Padrão já adotado em `HashingService`.
- Alternativa rejeitada: `interface` + `@Inject('TOKEN_STRING')` — mais boilerplate, mais sujeito a erros de digitação.

**3. Upload gerenciado no controller, não no use case**
- Razão: o upload é uma preocupação de infraestrutura da camada de apresentação (recebe `Express.Multer.File`). O use case recebe apenas a `url: string` resultante.
- Consequência: `StoragePort` é injetado diretamente no controller para fazer o upload antes de chamar o use case, passando a URL como parâmetro de entrada.

**4. Domain Events mantidos sem uso ativo**
- Razão: a infraestrutura (`DomainEvents`, `DomainEvent`, `EventHandler`) já existe. Removê-la agora seria disruptivo e criaria dívida técnica se quisermos adicioná-la depois. Mantê-la custa zero.
- Restrição: nenhum aggregate vai chamar `this.addDomainEvent()` nesta migração.

**5. Migração incremental módulo a módulo**
- Razão: garante que nenhum módulo não migrado quebre durante o processo. O código legado em `src/users/`, `src/animals/` etc. coexiste com os novos módulos em `src/modules/` durante a transição.
- Restrição crítica: módulos migrados em `src/modules/` e módulos legados em `src/` podem coexistir no `app.module.ts` durante a migração, mas não devem importar uns dos outros.

**6. `WatchedList<T>` para relações many-to-many no domínio**
- Usado em `Animal` para `ownerIds` (lista de tutores), permitindo rastrear adições e remoções sem precisar recarregar a relação completa do banco.
- O `TypeOrmAnimalRepository` usa `animal.ownerIds.getNewItems()` e `animal.ownerIds.getRemovedItems()` para sincronizar a tabela pivô `animal_users`.

### Riscos Conhecidos

**1. Relações complexas no TypeORM (animals/owners)**
- Risco: o código atual usa `createQueryBuilder().relation().of().loadMany()` para evitar sobrescrita da tabela pivô `animal_users`. A reimplementação precisa preservar esse comportamento.
- Mitigação: manter o uso de `RelationQueryBuilder` no `TypeOrmAnimalRepository` para `addOwner` e `removeOwner`.

**2. Cobertura de testes ≥ 80% em módulos complexos (Animals, Posts)**
- Risco: Animals tem 22+ use cases e regras de tutor complexas; Posts tem interações entre curtidas, comentários e feed com filtro de seguidores.
- Mitigação: priorizar unit tests (sem banco), focar nos cenários de erro nos use cases.

**3. Aliases de path no build de produção**
- Risco: `@shared/*` e `@modules/*` precisam de `tsconfig-paths` tanto no desenvolvimento quanto no build.
- Mitigação: verificar `tsconfig.build.json` herda os paths e que `start:prod` usa `tsconfig-paths/register`.

**4. Endpoints com alias de compatibilidade (owners)**
- Risco: `OwnersController` atual expõe `/animals/:id/owners/:ownerId` E `/animals/:id/owner/:ownerId` (singular/plural). Ambos precisam ser mantidos no controller migrado.
- Mitigação: manter os dois `@Post` e `@Delete` decorators no novo `OwnersController`.

### Conformidade com Skills Padrões

- `executar-task` — skill para implementação das tasks geradas a partir desta spec
- `criar-tasks` — skill para quebrar esta tech spec em tasks individuais por etapa
- `executar-review` — skill para revisar cada etapa após implementação
- `executar-qa` — skill para validar cobertura de testes e contratos de API

---

## Arquivos Relevantes e Dependentes

### Arquivos que serão criados (Etapa 0)

- `src/shared/domain/entity.ts` (movido de `src/core/entities/entity.ts`)
- `src/shared/domain/aggregate-root.ts` (movido de `src/core/entities/aggregate-root.ts`)
- `src/shared/domain/value-object.ts` (movido de `src/core/entities/value-object.ts`)
- `src/shared/domain/unique-entity-id.ts` (movido de `src/core/entities/unique-entity-id.ts`)
- `src/shared/domain/watched-list.ts` (movido de `src/core/entities/watched-list.ts`)
- `src/shared/domain/events/domain-events.ts` (movido de `src/core/events/domain-events.ts`)
- `src/shared/domain/events/domain-event.ts` (movido)
- `src/shared/domain/events/event-handler.ts` (movido)
- `src/shared/application/ports/hashing.port.ts`
- `src/shared/application/ports/storage.port.ts`
- `src/shared/infrastructure/hashing/bcrypt-hashing.adapter.ts`
- `src/shared/infrastructure/storage/s3-storage.adapter.ts`
- `src/shared/shared.module.ts`
- `test/e2e/helpers/app.helper.ts`
- `test/e2e/helpers/auth.helper.ts`
- `test/e2e/helpers/database.helper.ts`
- `test/jest-integration.json`
- `test/jest-e2e.json`

### Arquivos modificados (Etapa 0)

- `docker-compose.yml` — adicionar serviço `mysql-test`
- `tsconfig.json` — adicionar path aliases
- `package.json` — adicionar scripts de teste
- `src/app.module.ts` — remover `UploadModule`, importar `SharedModule`

### Arquivos de referência (sem alteração)

- `src/env/env.ts`, `src/env/env.service.ts`, `src/env/env.module.ts`
- `src/migrations/*.ts` — todas as migrations
- `data-source.ts` — atualizado apenas na Etapa 10 para apontar para novos ORM entities
- `src/common/guards/admin.guard.ts` — movido para `src/shared/presentation/guards/admin.guard.ts` na Etapa 0

### Dependências entre módulos (ordem de migração)

```
SharedModule (Etapa 0)
    └── UsersModule (Etapa 1)
            └── AuthModule (Etapa 2)
            └── AnimalsModule (Etapa 3) ← depende de UsersModule para relação owners
            └── PostsModule (Etapa 4) ← depende de UsersModule e AnimalsModule
                    └── EventsModule (Etapa 5) ← depende de PostsModule
            └── ConnectionsModule (Etapa 6) ← depende de UsersModule
            └── BlocksModule (Etapa 7) ← depende de UsersModule
            └── ReportsModule (Etapa 8) ← depende de UsersModule
            └── SupportModule (Etapa 9) ← depende de UsersModule
```