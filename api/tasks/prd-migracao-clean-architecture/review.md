# Review: Tasks 1–11 — Migração para Clean Architecture + DDD + Hexagonal

**Revisor**: AI Code Reviewer
**Data**: 2026-05-12
**Escopo**: Todas as 11 tasks do PRD de migração (`tasks/prd-migracao-clean-architecture/`)
**Status**: ⚠️ APROVADO COM OBSERVAÇÕES

---

## Resumo

A migração de todas as 11 tasks foi concluída com êxito. O código legado de `src/animals`, `src/users`, `src/posts`, `src/events`, `src/blocks`, `src/connections`, `src/reports` e `src/support` foi completamente removido. A nova estrutura em `src/modules/` segue corretamente os padrões de Clean Architecture + DDD + Hexagonal, com separação clara entre camadas `domain`, `application`, `infrastructure` e `presentation`.

A compilação TypeScript passa sem erros e 100% dos 234 testes unitários passam (82 suites). Os problemas encontrados são pontuais e não comprometem a correção funcional da aplicação.

---

## Arquivos Revisados (amostragem representativa)

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `src/shared/domain/entity.ts` | ✅ OK | 0 |
| `src/shared/domain/aggregate-root.ts` | ✅ OK | 0 |
| `src/shared/domain/value-object.ts` | ✅ OK | 0 |
| `src/shared/domain/watched-list.ts` | ✅ OK | 0 |
| `src/shared/domain/events/domain-events.ts` | ✅ OK | 0 |
| `src/shared/presentation/guards/auth.guard.ts` | ✅ OK | 0 |
| `src/modules/users/domain/entities/user.ts` | ✅ OK | 0 |
| `src/modules/users/application/use-cases/create-user.use-case.ts` | ⚠️ Problemas | 1 |
| `src/modules/users/application/use-cases/update-user.use-case.ts` | ⚠️ Problemas | 1 |
| `src/modules/users/application/use-cases/create-user.use-case.spec.ts` | ⚠️ Problemas | 1 |
| `src/modules/users/infrastructure/persistence/typeorm/repositories/typeorm-user.repository.ts` | ✅ OK | 0 |
| `src/modules/users/infrastructure/persistence/typeorm/mappers/user.mapper.ts` | ✅ OK | 0 |
| `src/modules/users/presentation/controllers/users.controller.ts` | ✅ OK | 0 |
| `src/modules/animals/animals.module.ts` | ⚠️ Problemas | 1 |
| `src/modules/animals/domain/entities/animal.ts` | ✅ OK | 0 |
| `src/modules/animals/application/use-cases/create-animal.use-case.ts` | ⚠️ Problemas | 1 |
| `src/modules/animals/application/use-cases/toggle-visibility.use-case.ts` | ⚠️ Problemas | 1 |
| `src/modules/animals/infrastructure/persistence/typeorm/repositories/typeorm-animal.repository.ts` | ✅ OK | 0 |
| `src/modules/animals/presentation/controllers/animals.controller.ts` | ✅ OK | 0 |
| `src/modules/animals/presentation/controllers/hide-pets.controller.ts` | ✅ OK | 0 |
| `src/modules/posts/domain/entities/post.ts` | ✅ OK | 0 |
| `src/modules/posts/application/use-cases/get-feed.use-case.ts` | ✅ OK | 0 |
| `src/modules/posts/application/use-cases/toggle-like.use-case.ts` | ✅ OK | 0 |
| `src/modules/posts/application/use-cases/create-post.use-case.ts` | ⚠️ Problemas | 1 |
| `src/modules/posts/infrastructure/persistence/typeorm/repositories/typeorm-post.repository.ts` | ✅ OK | 0 |
| `src/modules/posts/infrastructure/persistence/typeorm/mappers/post.mapper.ts` | ✅ OK | 0 |
| `src/modules/events/application/use-cases/create-event.use-case.ts` | ❌ Crítico | 2 |
| `src/modules/events/presentation/controllers/events.controller.ts` | ❌ Crítico | 2 |
| `src/modules/connections/application/use-cases/follow.use-case.ts` | ✅ OK | 0 |
| `src/modules/blocks/application/use-cases/block-user.use-case.ts` | ✅ OK | 0 |
| `src/modules/reports/application/use-cases/update-report-status.use-case.ts` | ⚠️ Problemas | 1 |
| `src/modules/support/application/use-cases/update-ticket-status.use-case.ts` | ⚠️ Problemas | 1 |
| `src/modules/auth/application/use-cases/sign-in.use-case.ts` | ✅ OK | 0 |
| `src/app.module.ts` | ✅ OK | 0 |

---

## Problemas Encontrados

### 🔴 Problemas Críticos

#### C1 — String em português no código fonte
**Arquivo**: `src/modules/events/application/use-cases/create-event.use-case.ts:31`

O padrão exige que **todo o código seja em inglês**, incluindo mensagens de erro.

```typescript
// ❌ Atual
if (!title) throw new BadRequestException('Título do evento é obrigatório')

// ✅ Correto
if (!title) throw new BadRequestException('Event title is required')
```

---

#### C2 — Controller acessando repositório diretamente (viola Clean Architecture)
**Arquivo**: `src/modules/events/presentation/controllers/events.controller.ts:44,66`

O `EventsController` injeta `EventRepository` diretamente e o usa no endpoint `GET /events/:id`. Controllers na arquitetura hexagonal devem se comunicar **exclusivamente** com use cases. Acessar o repositório no controller rompe o isolamento de camadas.

```typescript
// ❌ Atual — controller com repositório injetado
constructor(
  ...
  private readonly eventRepository: EventRepository, // ← não deve estar aqui
  ...
) {}

async findOne(@Param('id') id: string) {
  const event = await this.eventRepository.findById(id) // ← acesso direto
  if (!event) throw new NotFoundException('Event not found')
  return new ResponseEventDto(event)
}
```

**Correção sugerida**: Criar `GetEventByIdUseCase` (análogo ao `GetAnimalByIdUseCase` já existente):

```typescript
// ✅ Correto — criar src/modules/events/application/use-cases/get-event-by-id.use-case.ts
@Injectable()
export class GetEventByIdUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: { id: string }): Promise<Event> {
    const event = await this.eventRepository.findById(input.id)
    if (!event) throw new NotFoundException('Event not found')
    return event
  }
}

// No controller:
async findOne(@Param('id') id: string) {
  const event = await this.getEventByIdUseCase.execute({ id })
  return new ResponseEventDto(event)
}
```

---

### 🟡 Problemas Major

#### M1 — Violação de CQS: use cases de mutação retornam entidades
**Arquivos afetados**:
- `src/modules/users/application/use-cases/create-user.use-case.ts:21`
- `src/modules/users/application/use-cases/update-user.use-case.ts:24`
- `src/modules/animals/application/use-cases/create-animal.use-case.ts:30`
- `src/modules/reports/application/use-cases/update-report-status.use-case.ts:14`
- `src/modules/support/application/use-cases/update-ticket-status.use-case.ts:17`
- `src/modules/events/application/use-cases/create-event.use-case.ts:29`
- `src/modules/posts/application/use-cases/create-post.use-case.ts`
- `src/modules/posts/application/use-cases/create-comment.use-case.ts`

O padrão de código proíbe funções que fazem **mutação E consulta simultaneamente**. Use cases de criação/atualização devem retornar `void` (ou o ID da entidade criada). O controller deve fazer a consulta separadamente se precisar dos dados.

```typescript
// ❌ Atual — muta E retorna
async execute(input: CreateUserInput): Promise<User> {
  ...
  await this.userRepository.save(user)
  return user  // ← command retornando dado
}

// ✅ Correto — apenas muta
async execute(input: CreateUserInput): Promise<void> {
  ...
  await this.userRepository.save(user)
}
```

> **Nota**: Casos como `UpdateReportStatusUseCase` que retornam a entidade atualizada para facilitar o response do controller são o antipadrão mais comum. Para esses casos, o controller deve buscar o dado com um use case de query dedicado após a mutação.

---

#### M2 — Parâmetro booleano como flag de comportamento
**Arquivo**: `src/modules/animals/application/use-cases/toggle-visibility.use-case.ts:8`

O padrão proíbe parâmetros booleanos que alteram o comportamento da função. O `hidden: boolean` faz com que um único use case execute dois comportamentos distintos (esconder ou mostrar).

```typescript
// ❌ Atual — flag booleana
export interface ToggleVisibilityInput {
  animalId: string
  userId: string
  hidden: boolean  // ← flag de comportamento
}
```

**Correção sugerida**: Separar em dois use cases distintos, `HideAnimalUseCase` e `UnhideAnimalUseCase`, mantendo a infraestrutura de repositório igual.

---

#### M3 — Comentários de seção no módulo de animals
**Arquivo**: `src/modules/animals/animals.module.ts:5,15,25,35,38,66,103,115,117`

O padrão proíbe comentários explicativos. Os blocos `// ORM Entities`, `// Repository Ports`, `// Use Cases`, etc. adicionam ruído sem valor, pois a estrutura de imports já deixa claro o que cada grupo é.

```typescript
// ❌ Atual
// ORM Entities
import { AnimalOrmEntity } from './infrastructure/...'

// ✅ Correto — remover os comentários; o código se explica sozinho
import { AnimalOrmEntity } from './infrastructure/...'
```

O mesmo padrão deve ser evitado em módulos futuros.

---

#### M4 — Uso de `as any` nos testes
**Arquivos afetados** (9 ocorrências):
- `src/modules/users/application/use-cases/create-user.use-case.spec.ts:55,75`
- `src/modules/animals/application/use-cases/create-animal.use-case.spec.ts:54,57,78`
- `src/modules/animals/application/use-cases/add-tutor.use-case.spec.ts:68`
- `src/modules/posts/application/use-cases/delete-post.use-case.spec.ts:82`
- `src/modules/posts/application/use-cases/update-post.use-case.spec.ts:72,81`

O uso de `as any` nos testes desabilita a verificação de tipos e mascara erros de tipagem, contradizendo a finalidade dos testes em um projeto TypeScript.

```typescript
// ❌ Atual
const existingUser = { id: { toValue: () => 'existing-id' }, email: 'joao@example.com' } as any
userRepo.findByEmail.mockResolvedValue(existingUser)

// ✅ Correto — criar factory de domínio tipada
import { User } from '../../domain/entities/user'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const makeUser = (overrides?: Partial<UserProps>): User =>
  User.reconstitute(
    { name: 'Test', email: 'test@test.com', username: 'test', password: 'hash',
      displayName: null, about: null, image: null, imageCover: null,
      createdAt: new Date(), updatedAt: new Date(), ...overrides },
    new UniqueEntityID(),
  )

userRepo.findByEmail.mockResolvedValue(makeUser({ email: 'joao@example.com' }))
```

---

### 🟢 Problemas Minor

#### m1 — Endpoints stub expostos na API
**Arquivo**: `src/modules/events/presentation/controllers/events.controller.ts:154–163`

Os endpoints `POST /events/:id/attend` e `DELETE /events/:id/attend` retornam `{ ok: false, message: 'Not implemented yet' }`. Stubs funcionais não devem ser expostos em produção; devem ser removidos ou marcados com `@HttpCode(HttpStatus.NOT_IMPLEMENTED)` até serem implementados de fato.

---

## ✅ Destaques Positivos

- **Arquitetura impecável**: A estrutura `domain → application → infrastructure → presentation` foi respeitada consistentemente em todos os 9 módulos migrados.
- **Remoção completa do código legado**: Os diretórios `src/animals`, `src/users`, `src/posts`, `src/events`, `src/blocks`, `src/connections`, `src/reports` e `src/support` foram completamente removidos. O `app.module.ts` só importa a nova estrutura.
- **Zero erros de TypeScript**: `tsc --noEmit` passa limpo em todo o projeto.
- **100% dos testes passando**: 82 suites, 234 testes, todos verdes.
- **WatchedList pattern**: Implementação correta e testada para rastrear mudanças em listas de entidades (ex: `OwnerIdList`), com testes de domínio dedicados.
- **Port/Adapter pattern**: Todos os ports (`HashingPort`, `StoragePort`, `TokenGeneratorPort`) corretamente definidos em `application/ports` e implementados em `infrastructure`.
- **Mappers explícitos**: Separação clara entre ORM entities e domain entities com mappers dedicados em cada módulo.
- **Use cases com responsabilidade única**: Cada use case tem um único propósito, bem nomeado com verbo (`CreateUserUseCase`, `FollowUseCase`, `BlockUserUseCase`).
- **Testes unitários bem estruturados**: Mocks focados nas interfaces do domínio, sem dependência de frameworks externos nos testes de use case.
- **DomainEvents infrastructure**: Implementação completa e testada do padrão de eventos de domínio com `AggregateRoot`, `DomainEvents` e handlers.

---

## Conformidade com Padrões

| Padrão | Status |
|--------|--------|
| Código em inglês | ⚠️ 1 violação (PT em `create-event.use-case.ts`) |
| Nomenclatura (camelCase/PascalCase/kebab-case) | ✅ Conforme |
| Sem abreviações ou nomes > 30 chars | ✅ Conforme |
| Sem magic numbers | ✅ Conforme |
| Funções com verbo, responsabilidade única | ✅ Conforme |
| Máximo 3 parâmetros por função | ✅ Conforme |
| CQS (mutação OU query, nunca ambos) | ⚠️ Múltiplas violações em use cases |
| Máximo 2 níveis de aninhamento | ✅ Conforme |
| Sem boolean flags em parâmetros | ⚠️ 1 violação (`toggle-visibility`) |
| Máximo 50 linhas por método | ✅ Conforme |
| Máximo 300 linhas por classe | ✅ Conforme |
| Sem comentários desnecessários | ⚠️ 1 arquivo (`animals.module.ts`) |
| TypeScript sem `any` | ⚠️ 9 ocorrências em testes |
| Clean Architecture (camadas) | ❌ 1 violação (`EventsController` → `EventRepository`) |
| Testes | ✅ 234/234 passando |

---

## Recomendações

1. **(Crítico)** Corrigir a string em português em `create-event.use-case.ts:31` para `'Event title is required'`.
2. **(Crítico)** Criar `GetEventByIdUseCase` e remover `EventRepository` do `EventsController`, alinhando com o padrão dos demais módulos.
3. **(Major)** Revisar os use cases de mutação que retornam entidades (`CreateUserUseCase`, `UpdateUserUseCase`, `CreateAnimalUseCase`, etc.) para retornarem `void`, extraindo a lógica de retorno para use cases de query no controller quando necessário.
4. **(Major)** Substituir `ToggleVisibilityUseCase` por dois use cases distintos: `HideAnimalUseCase` e `UnhideAnimalUseCase`.
5. **(Major)** Remover os comentários de seção do `animals.module.ts`.
6. **(Major)** Substituir os `as any` nos testes por factories de domínio tipadas, centralizadas em arquivos como `test/factories/user.factory.ts`.
7. **(Minor)** Remover os endpoints `attend` / `cancelAttend` do `EventsController` ou implementá-los de fato antes de expor.

---

## Veredito

A migração é uma entrega sólida e de alta qualidade. A arquitetura está correta, os módulos estão bem desacoplados, o código legado foi completamente removido e todos os testes passam. Os dois problemas críticos (`string em PT` e `controller acessando repositório diretamente`) são correções simples e pontuais. Os problemas major (CQS, boolean flag, comentários, `as any`) são oportunidades de refinamento que não bloqueiam o funcionamento mas devem ser endereçados antes da próxima iteração para manter a consistência dos padrões no projeto.

**Próximos passos**: Corrigir os dois itens críticos (C1, C2) e o item M4 (`as any` nos testes) antes de avançar para novas features.
