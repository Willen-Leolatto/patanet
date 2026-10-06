# Clean Architecture + DDD + Hexagonal — Patanet API

## Índice

1. [Contexto e Objetivo](#1-contexto-e-objetivo)
2. [Diagnóstico da Estrutura Atual](#2-diagnóstico-da-estrutura-atual)
3. [Princípios das Arquiteturas Adotadas](#3-princípios-das-arquiteturas-adotadas)
4. [Estrutura de Diretórios Alvo](#4-estrutura-de-diretórios-alvo)
5. [Camadas e Responsabilidades](#5-camadas-e-responsabilidades)
6. [Domínios e Bounded Contexts](#6-domínios-e-bounded-contexts)
7. [Regras de Implementação por Camada](#7-regras-de-implementação-por-camada)
8. [Convenções de Nomenclatura](#8-convenções-de-nomenclatura)
9. [Integração com NestJS](#9-integração-com-nestjs)
10. [Pirâmide de Testes](#10-pirâmide-de-testes)
11. [Configuração de Testes](#11-configuração-de-testes)
12. [Plano de Migração](#12-plano-de-migração)
13. [Exemplos Concretos por Camada](#13-exemplos-concretos-por-camada)
14. [Checklist de Conclusão](#14-checklist-de-conclusão)

---

## 1. Contexto e Objetivo

### Contexto

A API do Patanet está organizada em módulos NestJS com uma estrutura flat: `controller → service → repository (TypeORM)`. Toda a lógica de negócio, infraestrutura e apresentação coexistem nos mesmos arquivos `*.service.ts`, tornando o projeto difícil de testar, escalar e manter.

### Objetivo

Reorganizar o projeto aplicando **Clean Architecture**, **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal (Ports & Adapters)** sem quebrar nenhum contrato de API existente. Os fronts (mobile, web) não devem perceber nenhuma mudança.

### Restrições não-negociáveis

- Todos os payloads de entrada e saída permanecem idênticos.
- Todos os endpoints (URLs, métodos, códigos de resposta) permanecem idênticos.
- Mesma stack: NestJS, TypeORM, MySQL, AWS S3/MinIO, JWT, bcryptjs, class-validator, class-transformer, Zod, Jest.
- Migrations existentes não são alteradas.
- O banco de dados e seu schema não mudam.

---

## 2. Diagnóstico da Estrutura Atual

### Problemas Identificados

| Problema | Onde Ocorre | Impacto |
|---|---|---|
| Lógica de negócio misturada com infraestrutura | `UsersService`, `AnimalsService`, `PostsService` | Impossível testar sem banco de dados |
| Services injetam `Repository<Entity>` diretamente | Todos os módulos | Acoplamento forte ao TypeORM |
| Entidades TypeORM são usadas como objetos de domínio | `User`, `Animal`, `Post`, etc. | Domínio depende de ORM |
| Regras de negócio sem abstração (ex: verificar tutor principal) | `owners.service.ts` | Regras espalhadas |
| `UploadService` (S3) chamado diretamente nos services | `users`, `animals`, `posts`, `events` | Domínio depende de infraestrutura concreta |
| Sem camada de Use Cases | — | Sem ponto único de orquestração |
| Sem nenhum teste | — | Zero confiança em mudanças |

### O Que Já Existe de Bom

- `HashingService` (abstract) + `BcryptHashingService` — padrão Port/Adapter já aplicado corretamente.
- `RequestPaginationDto` e `ResponsePaginationDto` compartilhados em `common/`.
- `AdminGuard` separado como guard reutilizável.
- `EnvService` centralizado para variáveis de ambiente.

---

## 3. Princípios das Arquiteturas Adotadas

### Clean Architecture

- Dependências apontam sempre para dentro (do infra → domain, nunca o contrário).
- Camadas: `Domain → Application → Infrastructure → Presentation`.
- O domínio não sabe nada sobre banco de dados, HTTP ou frameworks.

### Domain-Driven Design (DDD)

- **Entidades de Domínio**: objetos com identidade e ciclo de vida (sem decorators de ORM).
- **Value Objects**: objetos sem identidade, imutáveis (ex: `Email`, `Username`, `AnimalSize`).
- **Aggregates**: conjunto de entidades gerenciadas como uma unidade (ex: `Animal` agrega `Vaccine`, `Deworming`, `Medication`).
- **Repository Interfaces**: definidas no domínio, implementadas na infraestrutura.
- **Domain Services**: orquestram regras que envolvem múltiplas entidades do mesmo domínio.
- **Domain Events**: notificam mudanças de estado relevantes (ex: `AnimalCreatedEvent`).

### Hexagonal Architecture (Ports & Adapters)

- **Ports (interfaces)**: contratos definidos no domínio/aplicação.
  - *Driving ports*: interfaces que a aplicação expõe (use cases).
  - *Driven ports*: interfaces que a aplicação consome (repositórios, storage, hashing).
- **Adapters**: implementações concretas dos ports (TypeORM, S3, bcrypt, HTTP controllers).

---

## 4. Estrutura de Diretórios Alvo

```
src/
│
├── modules/                          # Módulos de negócio (Bounded Contexts)
│   │
│   ├── auth/
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── sign-in.use-case.ts
│   │   │   │   └── refresh-token.use-case.ts
│   │   │   └── ports/
│   │   │       └── token-generator.port.ts
│   │   ├── infrastructure/
│   │   │   └── jwt/
│   │   │       └── jwt-token-generator.adapter.ts
│   │   ├── presentation/
│   │   │   ├── http/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── dto/
│   │   │   │       ├── sign-in.request.dto.ts
│   │   │   │       └── sign-in.response.dto.ts
│   │   │   └── guards/
│   │   │       └── jwt-auth.guard.ts
│   │   └── auth.module.ts
│   │
│   ├── users/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── email.vo.ts
│   │   │   │   └── username.vo.ts
│   │   │   └── repositories/
│   │   │       └── user.repository.ts          # interface (Port)
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       ├── create-user.use-case.ts
│   │   │       ├── update-user.use-case.ts
│   │   │       ├── update-password.use-case.ts
│   │   │       ├── delete-user.use-case.ts
│   │   │       └── find-users.use-case.ts
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── typeorm/
│   │   │       │   ├── entities/
│   │   │       │   │   └── user.orm-entity.ts   # @Entity TypeORM
│   │   │       │   ├── repositories/
│   │   │       │   │   └── typeorm-user.repository.ts  # implements UserRepository
│   │   │       │   └── mappers/
│   │   │       │       └── user.mapper.ts       # ORM entity <-> Domain entity
│   │   ├── presentation/
│   │   │   └── http/
│   │   │       ├── users.controller.ts
│   │   │       └── dto/
│   │   │           ├── create-user.request.dto.ts
│   │   │           ├── update-user.request.dto.ts
│   │   │           └── user.response.dto.ts
│   │   └── users.module.ts
│   │
│   ├── animals/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── animal.ts
│   │   │   │   ├── vaccine.ts
│   │   │   │   ├── deworming.ts
│   │   │   │   └── medication.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── animal-size.vo.ts
│   │   │   │   └── animal-gender.vo.ts
│   │   │   ├── repositories/
│   │   │   │   ├── animal.repository.ts
│   │   │   │   ├── vaccine.repository.ts
│   │   │   │   ├── deworming.repository.ts
│   │   │   │   └── medication.repository.ts
│   │   │   └── services/
│   │   │       └── tutor-management.domain-service.ts
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       ├── create-animal.use-case.ts
│   │   │       ├── update-animal.use-case.ts
│   │   │       ├── delete-animal.use-case.ts
│   │   │       ├── add-tutor.use-case.ts
│   │   │       ├── remove-tutor.use-case.ts
│   │   │       ├── transfer-tutor.use-case.ts
│   │   │       ├── toggle-visibility.use-case.ts
│   │   │       ├── create-vaccine.use-case.ts
│   │   │       ├── create-deworming.use-case.ts
│   │   │       └── create-medication.use-case.ts
│   │   ├── infrastructure/
│   │   │   └── persistence/typeorm/
│   │   │       ├── entities/
│   │   │       ├── repositories/
│   │   │       └── mappers/
│   │   ├── presentation/
│   │   │   └── http/
│   │   │       ├── animals.controller.ts
│   │   │       ├── vaccines.controller.ts
│   │   │       ├── dewormings.controller.ts
│   │   │       ├── medications.controller.ts
│   │   │       ├── owners.controller.ts
│   │   │       ├── breeds.controller.ts
│   │   │       ├── species.controller.ts
│   │   │       └── dto/
│   │   └── animals.module.ts
│   │
│   ├── posts/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── post.ts
│   │   │   │   ├── comment.ts
│   │   │   │   ├── like.ts
│   │   │   │   └── media.ts
│   │   │   └── repositories/
│   │   │       ├── post.repository.ts
│   │   │       ├── comment.repository.ts
│   │   │       └── media.repository.ts
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       ├── create-post.use-case.ts
│   │   │       ├── update-post.use-case.ts
│   │   │       ├── delete-post.use-case.ts
│   │   │       ├── get-feed.use-case.ts
│   │   │       ├── toggle-like.use-case.ts
│   │   │       ├── create-comment.use-case.ts
│   │   │       ├── update-comment.use-case.ts
│   │   │       └── delete-comment.use-case.ts
│   │   ├── infrastructure/
│   │   │   └── persistence/typeorm/
│   │   │       ├── entities/
│   │   │       ├── repositories/
│   │   │       └── mappers/
│   │   ├── presentation/
│   │   │   └── http/
│   │   │       ├── posts.controller.ts
│   │   │       ├── comments.controller.ts
│   │   │       └── dto/
│   │   └── posts.module.ts
│   │
│   ├── connections/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   └── connections.module.ts
│   │
│   ├── blocks/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   └── blocks.module.ts
│   │
│   ├── events/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   └── events.module.ts
│   │
│   ├── reports/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   └── reports.module.ts
│   │
│   └── support/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── presentation/
│       └── support.module.ts
│
├── shared/                           # Código compartilhado entre módulos
│   ├── domain/
│   │   └── value-objects/
│   │       ├── unique-id.vo.ts       # Wrapper de UUID
│   │       └── pagination.vo.ts
│   ├── application/
│   │   ├── ports/
│   │   │   ├── hashing.port.ts       # (já existe como HashingService)
│   │   │   └── storage.port.ts       # Port para upload (S3/MinIO)
│   │   └── dto/
│   │       ├── pagination.request.dto.ts
│   │       └── pagination.response.dto.ts
│   └── infrastructure/
│       ├── hashing/
│       │   └── bcrypt-hashing.adapter.ts
│       └── storage/
│           └── s3-storage.adapter.ts
│
├── core/                             # Bootstrap e configuração global
│   ├── database/
│   │   └── database.module.ts
│   ├── env/
│   │   ├── env.module.ts
│   │   ├── env.service.ts
│   │   └── env.ts
│   └── main.ts
│
└── app.module.ts
```

---

## 5. Camadas e Responsabilidades

### Domain Layer (núcleo)

**Responsabilidade:** Expressar o negócio puro. Não tem dependências externas.

| Artefato | Responsabilidade |
|---|---|
| `Entity` | Objeto com identidade, estado e comportamento de negócio. Sem decorators de ORM. |
| `Value Object` | Objeto sem identidade, imutável. Validação interna. |
| `Repository Interface` | Contrato para persistência. Só define métodos, sem implementação. |
| `Domain Service` | Lógica de negócio que envolve mais de uma entidade do mesmo contexto. |
| `Domain Event` | Notifica que algo relevante aconteceu (opcional, para desacoplamento futuro). |

**Regra de ouro:** Nenhum import de `@nestjs/...`, `typeorm`, `bcrypt`, `aws-sdk` ou qualquer lib de infra.

### Application Layer

**Responsabilidade:** Orquestrar casos de uso. Coordena domínio e ports.

| Artefato | Responsabilidade |
|---|---|
| `Use Case` | Um único caso de uso do sistema. Recebe um DTO de entrada, executa lógica via domínio, retorna DTO de saída. |
| `Port (Input)` | Interface que define o contrato do use case (opcional, facilita mocks). |
| `Port (Output)` | Interface que define o que a aplicação precisa do mundo externo (storage, email, etc.). |

**Regra de ouro:** Use cases NÃO conhecem HTTP, NestJS, TypeORM. Só interagem com interfaces (ports) e entidades de domínio.

### Infrastructure Layer

**Responsabilidade:** Implementar os ports. Adaptar mundo externo ao que o domínio precisa.

| Artefato | Responsabilidade |
|---|---|
| `ORM Entity` | Entidade TypeORM com decorators. Representa o schema do banco. |
| `Repository Impl` | Implementa a interface do repositório usando TypeORM. |
| `Mapper` | Converte entre ORM Entity e Domain Entity (e vice-versa). |
| `Storage Adapter` | Implementa `StoragePort` usando AWS S3 SDK. |
| `Hashing Adapter` | Implementa `HashingPort` usando bcryptjs. |

### Presentation Layer

**Responsabilidade:** Receber requisições HTTP, validar input, delegar ao use case, formatar resposta.

| Artefato | Responsabilidade |
|---|---|
| `Controller` | Rota HTTP. Valida DTO de entrada, chama use case, retorna DTO de saída. |
| `Request DTO` | Validação de entrada via `class-validator`. |
| `Response DTO` | Serialização de saída via `class-transformer` / `@Exclude`/`@Expose`. |
| `Guard` | Verificações de autenticação/autorização no nível HTTP. |

---

## 6. Domínios e Bounded Contexts

```
┌─────────────────────────────────────────────────────────┐
│                    Patanet API                          │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │   Auth   │  │  Users   │  │      Animals        │   │
│  │          │  │          │  │  (pets, tutores,     │   │
│  │ sign-in  │  │ profile  │  │  saúde: vacinas,    │   │
│  │ refresh  │  │ password │  │  vermifugação,      │   │
│  └──────────┘  └──────────┘  │  medicamentos,      │   │
│                               │  breeds, species)   │   │
│                               └────────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │
│  │  Posts   │  │  Events  │  │   Connections     │     │
│  │          │  │          │  │  (follow/unfollow) │     │
│  │ feed     │  │ eventos  │  └──────────────────┘     │
│  │ likes    │  │ repost   │                            │
│  │ comments │  └──────────┘  ┌──────────────────┐     │
│  └──────────┘                │     Blocks        │     │
│                               └──────────────────┘     │
│  ┌──────────────┐  ┌────────────────────────────┐     │
│  │   Reports    │  │          Support            │     │
│  │  (denúncias) │  │  (tickets + mensagens)      │     │
│  └──────────────┘  └────────────────────────────┘     │
│                                                         │
│  ──────────────── Shared Kernel ──────────────────     │
│  HashingPort | StoragePort | Pagination | UniqueId      │
└─────────────────────────────────────────────────────────┘
```

### Aggregate Roots

| Aggregate Root | Membros |
|---|---|
| `User` | — |
| `Animal` | `Vaccine`, `Deworming`, `Medication`, `AnimalMedia`, tutores (relação) |
| `Post` | `Media`, `Like`, `Comment` |
| `Event` | vinculado a `Post` |
| `Block` | — |
| `Connection` | — |
| `Report` | — |
| `SupportTicket` | `SupportTicketMessage` |

---

## 7. Regras de Implementação por Camada

### Domain Entity

```typescript
// src/modules/users/domain/entities/user.ts
export class User {
  readonly id: string
  name: string
  displayName: string | null
  about: string | null
  image: string | null
  imageCover: string | null
  username: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date

  // Construtor privado — use factory method
  private constructor(props: UserProps) {
    Object.assign(this, props)
  }

  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    return new User({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitute(props: UserProps): User {
    return new User(props)
  }

  changePassword(newHashedPassword: string): void {
    this.password = newHashedPassword
    this.updatedAt = new Date()
  }

  updateProfile(data: Partial<Pick<User, 'name' | 'displayName' | 'about' | 'image' | 'imageCover' | 'username' | 'email'>>): void {
    Object.assign(this, data)
    this.updatedAt = new Date()
  }
}
```

### Repository Interface (Port)

```typescript
// src/modules/users/domain/repositories/user.repository.ts
import { User } from '../entities/user'

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByEmail(email: string): Promise<User | null>
  abstract findByUsername(username: string): Promise<User | null>
  abstract findMany(params: { query?: string; page: number; perPage: number }): Promise<{ items: User[]; total: number }>
  abstract save(user: User): Promise<void>
  abstract delete(id: string): Promise<void>
}
```

### ORM Entity (Infrastructure)

```typescript
// src/modules/users/infrastructure/persistence/typeorm/entities/user.orm-entity.ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column() name: string
  @Column({ name: 'display_name', nullable: true }) displayName: string | null
  // ... demais campos
}
```

### Mapper

```typescript
// src/modules/users/infrastructure/persistence/typeorm/mappers/user.mapper.ts
import { User } from '../../../../domain/entities/user'
import { UserOrmEntity } from '../entities/user.orm-entity'

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.reconstitute({
      id: orm.id,
      name: orm.name,
      displayName: orm.displayName,
      email: orm.email,
      username: orm.username,
      password: orm.password,
      about: orm.about,
      image: orm.image,
      imageCover: orm.imageCover,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    })
  }

  static toOrm(user: User): UserOrmEntity {
    const orm = new UserOrmEntity()
    orm.id = user.id
    orm.name = user.name
    orm.displayName = user.displayName
    orm.email = user.email
    orm.username = user.username
    orm.password = user.password
    orm.about = user.about
    orm.image = user.image
    orm.imageCover = user.imageCover
    return orm
  }
}
```

### Repository Implementation

```typescript
// src/modules/users/infrastructure/persistence/typeorm/repositories/typeorm-user.repository.ts
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import { UserRepository } from '../../../../domain/repositories/user.repository'
import { User } from '../../../../domain/entities/user'
import { UserOrmEntity } from '../entities/user.orm-entity'
import { UserMapper } from '../mappers/user.mapper'

export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {
    super()
  }

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id } })
    return orm ? UserMapper.toDomain(orm) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email } })
    return orm ? UserMapper.toDomain(orm) : null
  }

  async findByUsername(username: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { username } })
    return orm ? UserMapper.toDomain(orm) : null
  }

  async findMany({ query, page, perPage }: { query?: string; page: number; perPage: number }) {
    const where = query
      ? [{ name: Like(`%${query}%`) }, { username: Like(`%${query}%`) }, { email: Like(`%${query}%`) }]
      : undefined
    const [items, total] = await this.repo.findAndCount({ where, take: perPage, skip: (page - 1) * perPage })
    return { items: items.map(UserMapper.toDomain), total }
  }

  async save(user: User): Promise<void> {
    const orm = UserMapper.toOrm(user)
    await this.repo.save(orm)
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id)
  }
}
```

### Use Case

```typescript
// src/modules/users/application/use-cases/create-user.use-case.ts
import { ConflictException, Injectable } from '@nestjs/common'
import { UserRepository } from '../../domain/repositories/user.repository'
import { User } from '../../domain/entities/user'
import { HashingPort } from '../../../../shared/application/ports/hashing.port'

export interface CreateUserInput {
  name: string
  username: string
  email: string
  password: string
  image?: string | null
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingPort: HashingPort,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const emailInUse = await this.userRepository.findByEmail(input.email)
    if (emailInUse) throw new ConflictException('Email already exists')

    const usernameInUse = await this.userRepository.findByUsername(input.username)
    if (usernameInUse) throw new ConflictException('Username already exists')

    const hashedPassword = await this.hashingPort.hash(input.password)

    const user = User.create({
      name: input.name,
      username: input.username,
      email: input.email,
      password: hashedPassword,
      image: input.image ?? null,
      displayName: null,
      about: null,
      imageCover: null,
    })

    await this.userRepository.save(user)
    return user
  }
}
```

### Storage Port

```typescript
// src/shared/application/ports/storage.port.ts
export abstract class StoragePort {
  abstract upload(file: { buffer: Buffer; mimetype: string; originalname: string }): Promise<{ url: string }>
  abstract delete(url: string): Promise<void>
}
```

### Storage Adapter

```typescript
// src/shared/infrastructure/storage/s3-storage.adapter.ts
import { Injectable } from '@nestjs/common'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { StoragePort } from '../../application/ports/storage.port'

@Injectable()
export class S3StorageAdapter extends StoragePort {
  private readonly client: S3Client

  constructor() {
    super()
    this.client = new S3Client({
      endpoint: process.env.AWS_ENDPOINT || '',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    })
  }

  async upload(file: { buffer: Buffer; mimetype: string; originalname: string }) {
    const bucketName = process.env.AWS_BUCKET_NAME
    const key = `${randomUUID()}-${file.originalname}`
    await this.client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: file.mimetype,
      Body: file.buffer,
      ACL: 'public-read',
    }))
    return { url: `${process.env.AWS_ENDPOINT}/${bucketName}/${key}` }
  }

  async delete(url: string) {
    const key = url.split('/').pop()
    if (!key) return
    await this.client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }))
  }
}
```

---

## 8. Convenções de Nomenclatura

| Artefato | Sufixo / Convenção | Exemplo |
|---|---|---|
| Domain Entity | sem sufixo | `user.ts` → `class User` |
| Value Object | `.vo.ts` | `email.vo.ts` → `class Email` |
| Repository Interface | `.repository.ts` | `user.repository.ts` → `abstract class UserRepository` |
| Domain Service | `.domain-service.ts` | `tutor-management.domain-service.ts` |
| Use Case | `.use-case.ts` | `create-user.use-case.ts` → `class CreateUserUseCase` |
| Port (shared) | `.port.ts` | `storage.port.ts` → `abstract class StoragePort` |
| ORM Entity | `.orm-entity.ts` | `user.orm-entity.ts` → `class UserOrmEntity` |
| Repository Impl | `typeorm-{name}.repository.ts` | `typeorm-user.repository.ts` |
| Mapper | `.mapper.ts` | `user.mapper.ts` → `class UserMapper` |
| Adapter | `.adapter.ts` | `s3-storage.adapter.ts` → `class S3StorageAdapter` |
| Request DTO (HTTP) | `.request.dto.ts` | `create-user.request.dto.ts` |
| Response DTO (HTTP) | `.response.dto.ts` | `user.response.dto.ts` |
| Controller | `.controller.ts` | `users.controller.ts` |
| Guard | `.guard.ts` | `jwt-auth.guard.ts` |
| Module | `.module.ts` | `users.module.ts` |
| Spec (unit) | `.spec.ts` | `create-user.use-case.spec.ts` |
| Spec (integration) | `.integration.spec.ts` | `typeorm-user.repository.integration.spec.ts` |
| Spec (e2e) | `.e2e-spec.ts` | `users.e2e-spec.ts` |

---

## 9. Integração com NestJS

### Binding de Port para Adapter no Module

```typescript
// src/modules/users/users.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserOrmEntity } from './infrastructure/persistence/typeorm/entities/user.orm-entity'
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository'
import { UserRepository } from './domain/repositories/user.repository'
import { CreateUserUseCase } from './application/use-cases/create-user.use-case'
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case'
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case'
import { FindUsersUseCase } from './application/use-cases/find-users.use-case'
import { UsersController } from './presentation/http/users.controller'

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    // Binding: injetar TypeOrmUserRepository quando alguém pedir UserRepository
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    FindUsersUseCase,
  ],
  exports: [UserRepository, FindUsersUseCase],
})
export class UsersModule {}
```

### Controller chamando Use Case

```typescript
// src/modules/users/presentation/http/users.controller.ts
import { Body, Controller, Delete, Get, Patch, Post, Query, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case'
import { CreateUserRequestDto } from './dto/create-user.request.dto'
import { UserResponseDto } from './dto/user.response.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  async create(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute(dto)
    return UserResponseDto.fromDomain(user)
  }
}
```

### Shared Module (Ports globais)

```typescript
// src/shared/shared.module.ts
import { Global, Module } from '@nestjs/common'
import { HashingPort } from './application/ports/hashing.port'
import { BcryptHashingAdapter } from './infrastructure/hashing/bcrypt-hashing.adapter'
import { StoragePort } from './application/ports/storage.port'
import { S3StorageAdapter } from './infrastructure/storage/s3-storage.adapter'

@Global()
@Module({
  providers: [
    { provide: HashingPort, useClass: BcryptHashingAdapter },
    { provide: StoragePort, useClass: S3StorageAdapter },
  ],
  exports: [HashingPort, StoragePort],
})
export class SharedModule {}
```

---

## 10. Pirâmide de Testes

```
              ┌───────────────────────────┐
              │         E2E Tests         │  ← Poucos, lentos, testam fluxos completos
              │   (API endpoints reais)   │     via HTTP com banco real
              └───────────────────────────┘
          ┌───────────────────────────────────┐
          │      Integration Tests            │  ← Moderados, testam adapters com banco real
          │  (Repositories, Storage, Modules) │     (TypeORM com MySQL de teste)
          └───────────────────────────────────┘
      ┌───────────────────────────────────────────┐
      │            Unit Tests                     │  ← Muitos, rápidos, testam use cases
      │  (Use Cases, Domain Entities, Mappers)    │     e domínio com mocks/stubs
      └───────────────────────────────────────────┘
```

### Distribuição esperada

| Camada | Quantidade | Velocidade | Estratégia |
|---|---|---|---|
| Unit | ~60% do total | < 1ms cada | Mocks de ports, sem I/O |
| Integration | ~30% do total | < 500ms cada | Banco MySQL real (test container ou docker-compose) |
| E2E | ~10% do total | < 5s cada | App completo com banco real, HTTP via supertest |

### O que testar em cada camada

**Unit Tests (Use Cases e Domain):**
- Todas as regras de negócio do use case
- Cenários de erro (ConflictException, NotFoundException, UnauthorizedException)
- Comportamento das domain entities (ex: `user.changePassword`, `animal.canRemoveTutor`)
- Mappers (toDomain e toOrm, sem banco)

**Integration Tests (Infrastructure):**
- Repository implementations lendo/escrevendo no banco real
- Verificar que queries TypeORM retornam os dados esperados
- Testar transações (ex: criação de Event + Post atomicamente)

**E2E Tests (API):**
- Fluxo completo de autenticação (cadastro → login → uso de token)
- CRUD de pets com fluxo de tutores
- Feed de posts
- Criação e repostagem de eventos
- Abertura e status de tickets e denúncias
- Controle de acesso: usuário comum vs admin vs não autenticado

---

## 11. Configuração de Testes

### Estrutura de diretórios de teste

```
test/
├── e2e/
│   ├── auth.e2e-spec.ts
│   ├── users.e2e-spec.ts
│   ├── animals.e2e-spec.ts
│   ├── posts.e2e-spec.ts
│   ├── events.e2e-spec.ts
│   ├── connections.e2e-spec.ts
│   ├── blocks.e2e-spec.ts
│   ├── reports.e2e-spec.ts
│   ├── support.e2e-spec.ts
│   └── helpers/
│       ├── app.helper.ts        # cria instância da app para testes
│       ├── auth.helper.ts       # funções de login/criação de usuário
│       └── database.helper.ts   # reset de banco entre testes
├── jest-e2e.json
└── jest-integration.json
```

### jest.config.ts (unit tests — já existente, ajustar)

```typescript
// package.json → jest
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### jest-integration.json

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.integration\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "globalSetup": "<rootDir>/../test/helpers/setup-integration.ts",
  "globalTeardown": "<rootDir>/../test/helpers/teardown-integration.ts"
}
```

### jest-e2e.json (já existe, ajustar)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "testTimeout": 30000
}
```

### Scripts no package.json

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

### Exemplo de Unit Test (Use Case)

```typescript
// src/modules/users/application/use-cases/create-user.use-case.spec.ts
import { ConflictException } from '@nestjs/common'
import { CreateUserUseCase } from './create-user.use-case'
import { UserRepository } from '../../domain/repositories/user.repository'
import { HashingPort } from '../../../../shared/application/ports/hashing.port'

const makeUserRepositoryMock = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as any)

const makeHashingPortMock = (): jest.Mocked<HashingPort> => ({
  hash: jest.fn(),
  compare: jest.fn(),
} as any)

describe('CreateUserUseCase', () => {
  let sut: CreateUserUseCase
  let userRepository: jest.Mocked<UserRepository>
  let hashingPort: jest.Mocked<HashingPort>

  beforeEach(() => {
    userRepository = makeUserRepositoryMock()
    hashingPort = makeHashingPortMock()
    sut = new CreateUserUseCase(userRepository, hashingPort)

    userRepository.findByEmail.mockResolvedValue(null)
    userRepository.findByUsername.mockResolvedValue(null)
    userRepository.save.mockResolvedValue()
    hashingPort.hash.mockResolvedValue('hashed-password')
  })

  it('deve criar um usuário com sucesso', async () => {
    const user = await sut.execute({
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    })

    expect(user.name).toBe('John Doe')
    expect(user.email).toBe('john@example.com')
    expect(user.password).toBe('hashed-password')
    expect(userRepository.save).toHaveBeenCalledTimes(1)
  })

  it('deve lançar ConflictException se email já existe', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 'existing' } as any)

    await expect(sut.execute({
      name: 'John',
      username: 'john',
      email: 'john@example.com',
      password: '12345678',
    })).rejects.toThrow(ConflictException)
  })

  it('deve lançar ConflictException se username já existe', async () => {
    userRepository.findByUsername.mockResolvedValue({ id: 'existing' } as any)

    await expect(sut.execute({
      name: 'John',
      username: 'john',
      email: 'john@example.com',
      password: '12345678',
    })).rejects.toThrow(ConflictException)
  })
})
```

### Exemplo de Integration Test (Repository)

```typescript
// src/modules/users/infrastructure/persistence/typeorm/repositories/typeorm-user.repository.integration.spec.ts
import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeOrmUserRepository } from './typeorm-user.repository'
import { UserRepository } from '../../../../domain/repositories/user.repository'
import { UserOrmEntity } from '../entities/user.orm-entity'
import { User } from '../../../../domain/entities/user'

describe('TypeOrmUserRepository (integration)', () => {
  let repository: UserRepository

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST_TEST || 'localhost',
          port: 3306,
          username: 'root',
          password: 'root',
          database: 'patanet_test',
          entities: [UserOrmEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([UserOrmEntity]),
      ],
      providers: [{ provide: UserRepository, useClass: TypeOrmUserRepository }],
    }).compile()

    repository = module.get(UserRepository)
  })

  it('deve salvar e recuperar um usuário por email', async () => {
    const user = User.create({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hash',
      displayName: null,
      about: null,
      image: null,
      imageCover: null,
    })

    await repository.save(user)
    const found = await repository.findByEmail('test@example.com')

    expect(found).not.toBeNull()
    expect(found!.name).toBe('Test User')
  })
})
```

### Exemplo de E2E Test

```typescript
// test/e2e/auth.e2e-spec.ts
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { createTestApp } from '../helpers/app.helper'
import { resetDatabase } from '../helpers/database.helper'

describe('Auth (E2E)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /auth/signup', () => {
    it('deve criar um novo usuário e retornar 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'John', username: 'johndoe', email: 'john@test.com', password: 'password123' })

      expect(res.status).toBe(201)
    })

    it('deve retornar 409 se email já existe', async () => {
      const body = { name: 'John', username: 'johndoe', email: 'john@test.com', password: 'password123' }
      await request(app.getHttpServer()).post('/auth/signup').send(body)
      const res = await request(app.getHttpServer()).post('/auth/signup').send(body)

      expect(res.status).toBe(409)
    })
  })

  describe('POST /auth/signin', () => {
    it('deve retornar accessToken e refreshToken', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'John', username: 'johndoe', email: 'john@test.com', password: 'password123' })

      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ username: 'johndoe', password: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
    })

    it('deve retornar 401 para credenciais inválidas', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ username: 'nobody', password: 'wrongpass' })

      expect(res.status).toBe(401)
    })
  })
})
```

---

## 12. Plano de Migração

A migração deve ser feita **incrementalmente por domínio**, mantendo o código atual funcional até que cada módulo esteja 100% migrado. Nenhuma funcionalidade é removida; apenas reorganizada.

### Etapa 0 — Preparação (sem alterar código de negócio)

- [ ] Criar a estrutura de diretórios `src/modules/` e `src/shared/`
- [ ] Configurar `tsconfig.json` com paths para os novos diretórios
- [ ] Criar `SharedModule` com `HashingPort` e `StoragePort` (renomear `HashingService` e `UploadService` para os adapters correspondentes)
- [ ] Configurar Jest para unit, integration e e2e
- [ ] Adicionar banco de dados de teste no `docker-compose.yml` (ex: `patanet_test`)
- [ ] Criar helpers de teste (`createTestApp`, `resetDatabase`)

### Etapa 1 — Users

- [ ] Criar `User` domain entity com factory methods
- [ ] Criar `UserRepository` interface (Port)
- [ ] Criar `UserOrmEntity` e `UserMapper`
- [ ] Criar `TypeOrmUserRepository` (Adapter)
- [ ] Criar use cases: `CreateUser`, `UpdateUser`, `UpdatePassword`, `DeleteUser`, `FindUsers`
- [ ] Migrar `UsersController` para chamar use cases
- [ ] Criar `UsersModule` com bindings
- [ ] Escrever testes unit para todos os use cases
- [ ] Escrever teste integration para `TypeOrmUserRepository`
- [ ] Escrever testes E2E para `/users` endpoints

### Etapa 2 — Auth

- [ ] Criar `TokenGeneratorPort` (abstract)
- [ ] Criar `JwtTokenGeneratorAdapter`
- [ ] Criar use cases: `SignIn`, `RefreshToken`
- [ ] Migrar `AuthController`
- [ ] Testes unit, E2E

### Etapa 3 — Animals

- [ ] Domain entities: `Animal`, `Vaccine`, `Deworming`, `Medication`
- [ ] Value objects: `AnimalSize`, `AnimalGender`
- [ ] `TutorManagementDomainService` (regras de tutor principal)
- [ ] Repository interfaces para cada entidade
- [ ] ORM entities + mappers + repository implementations
- [ ] Use cases: `CreateAnimal`, `UpdateAnimal`, `DeleteAnimal`, `AddTutor`, `RemoveTutor`, `TransferTutor`, `ToggleVisibility`, `CreateVaccine`, `UpdateVaccine`, `DeleteVaccine`, `CreateDeworming`, `CreateMedication`, etc.
- [ ] Testes unit, integration, E2E

### Etapa 4 — Posts

- [ ] Domain entities: `Post`, `Comment`, `Like`, `Media`
- [ ] Repository interfaces
- [ ] ORM + mappers + implementations
- [ ] Use cases: `CreatePost`, `UpdatePost`, `DeletePost`, `GetFeed`, `ToggleLike`, `CreateComment`, `UpdateComment`, `DeleteComment`
- [ ] Testes unit, integration, E2E

### Etapa 5 — Events

- [ ] Domain entity: `Event` (com lógica de vinculação ao Post)
- [ ] Use cases: `CreateEvent`, `UpdateEvent`, `RepostEvent`, `DeleteEvent`, `ListEvents`
- [ ] Testes unit, integration, E2E

### Etapa 6 — Connections

- [ ] Domain entity: `Connection`
- [ ] Use cases: `Follow`, `Unfollow`, `ListFollowers`, `ListFolloweds`
- [ ] Testes

### Etapa 7 — Blocks

- [ ] Domain entity: `Block`
- [ ] Use cases: `BlockUser`, `UnblockUser`, `ListBlocks`
- [ ] Testes

### Etapa 8 — Reports

- [ ] Domain entity: `Report` com enum de status e categoria
- [ ] Use cases: `CreateReport`, `UpdateReportStatus` (admin), `ListMyReports`
- [ ] Testes

### Etapa 9 — Support

- [ ] Domain entities: `SupportTicket`, `SupportTicketMessage`
- [ ] Use cases: `CreateTicket`, `SendMessage`, `UpdateTicketStatus` (admin), `ListMyTickets`, `ListAllTickets` (admin)
- [ ] Testes

### Etapa 10 — Limpeza

- [ ] Remover módulos e arquivos da estrutura antiga (`src/animals/`, `src/users/`, etc.)
- [ ] Validar cobertura de testes ≥ 80% em todas as camadas
- [ ] Revisar `app.module.ts` com novos módulos
- [ ] Atualizar `data-source.ts` para apontar para as novas ORM entities

---

## 13. Exemplos Concretos por Camada

### Domain Service — Gestão de Tutores

```typescript
// src/modules/animals/domain/services/tutor-management.domain-service.ts
import { Animal } from '../entities/animal'

export class TutorManagementDomainService {
  canAddTutor(requesterId: string, animal: Animal): boolean {
    return animal.ownerId === requesterId
  }

  canRemoveTutor(requesterId: string, targetTutorId: string, animal: Animal): boolean {
    if (animal.ownerId !== requesterId) return false
    if (targetTutorId === requesterId) return false  // Tutor principal não pode se remover
    return true
  }

  canTransferOwnership(requesterId: string, animal: Animal): boolean {
    return animal.ownerId === requesterId
  }

  isLastTutor(animal: Animal): boolean {
    return animal.ownerIds.length <= 1
  }
}
```

### Value Object — Email

```typescript
// src/modules/users/domain/value-objects/email.vo.ts
export class Email {
  private readonly value: string

  constructor(email: string) {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email')
    }
    this.value = email.toLowerCase().trim()
  }

  toString(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }
}
```

### Response DTO — Contrato mantido

```typescript
// src/modules/users/presentation/http/dto/user.response.dto.ts
import { Exclude, Expose } from 'class-transformer'
import { User } from '../../../domain/entities/user'

@Exclude()
export class UserResponseDto {
  @Expose() id: string
  @Expose() name: string
  @Expose() displayName: string | null
  @Expose() username: string
  @Expose() email: string
  @Expose() about: string | null
  @Expose() image: string | null
  @Expose() imageCover: string | null
  @Expose() createdAt: Date
  @Expose() updatedAt: Date

  static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto()
    Object.assign(dto, user)
    return dto
  }
}
```

---

## 14. Checklist de Conclusão

### Arquitetura

- [ ] Domínio livre de imports de ORM, HTTP e frameworks de infra
- [ ] Todos os ports são abstract classes (NestJS injection-friendly)
- [ ] Todos os adapters implementam/estendem seus respectivos ports
- [ ] Mappers presentes para todos os ORM entities
- [ ] Use cases não fazem queries diretas ao banco

### Contratos de API

- [ ] Todos os endpoints existentes respondem com os mesmos payloads
- [ ] Nenhum campo de resposta foi renomeado ou removido
- [ ] Códigos de status HTTP mantidos
- [ ] Validações de entrada (class-validator) mantidas ou melhoradas

### Testes

- [ ] Cobertura unit ≥ 80% nos use cases
- [ ] Todos os repositórios têm integration tests
- [ ] Todos os fluxos principais cobertos por E2E
- [ ] `npm run test:all` passa sem erros
- [ ] CI/CD executa os 3 tipos de teste

### Qualidade

- [ ] Sem `any` não justificado no código de domínio e aplicação
- [ ] Lint passa sem erros (`npm run lint`)
- [ ] Build passa sem erros (`npm run build`)
- [ ] Docker Compose funcional com banco de teste separado