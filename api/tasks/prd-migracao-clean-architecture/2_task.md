# Tarefa 2.0: Migração do Módulo Users

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Primeiro módulo de negócio migrado para Clean Architecture. Estabelece o padrão arquitetural que será replicado em todos os módulos seguintes. Ao final desta tarefa, `src/users/` é removido e substituído por `src/modules/users/` com domain, application, infrastructure e presentation desacopladas.

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — padrão de domain entity, repository port, use case, ORM entity, mapper e bindings no module
- `nestjs-best-practices` — estrutura do UsersModule com bindings Port → Adapter
- `nestjs-testing-expert` — unit tests de use cases com mocks de ports, integration tests de repositório
</skills>

<requirements>
- Domain entity `User` com factory methods `create` e `reconstitute`, métodos `changePassword` e `updateProfile`
- Abstract class `UserRepository` com métodos: `findById`, `findByEmail`, `findByUsername`, `findMany`, `save`, `delete`
- `UserOrmEntity` com os mesmos campos e schema da ORM entity existente (sem alterar colunas)
- `UserMapper` com métodos estáticos `toDomain` e `toOrm`
- `TypeOrmUserRepository` implementando `UserRepository`
- Use cases: `CreateUserUseCase`, `UpdateUserUseCase`, `UpdatePasswordUseCase`, `DeleteUserUseCase`, `FindUsersUseCase`
- `UsersController` atualizado para chamar use cases (sem lógica de negócio no controller)
- `StoragePort` injetado diretamente no controller para upload de imagem (antes de chamar o use case)
- `UsersModule` com bindings `{ provide: UserRepository, useClass: TypeOrmUserRepository }`
- Remover `src/users/` ao final
- Contratos de API preservados (mesmos endpoints, payloads e status HTTP)
</requirements>

## Subtarefas

- [x] 2.1 Criar `src/modules/users/domain/entities/user.ts` com factory methods e métodos de domínio
- [x] 2.2 Criar `src/modules/users/domain/repositories/user.repository.ts` (abstract class)
- [x] 2.3 Criar `UserOrmEntity`, `UserMapper` e `TypeOrmUserRepository`
- [x] 2.4 Criar `CreateUserUseCase` e `FindUsersUseCase`
- [x] 2.5 Criar `UpdateUserUseCase`, `UpdatePasswordUseCase` e `DeleteUserUseCase`
- [x] 2.6 Criar `UsersController` e DTOs de request/response
- [x] 2.7 Criar `UsersModule` com todos os bindings e registrar no `app.module.ts`
- [x] 2.8 Remover `src/users/` e validar build
- [x] 2.9 Escrever testes unitários para todos os use cases
- [x] 2.10 Escrever teste de integração para `TypeOrmUserRepository`
- [x] 2.11 Escrever testes E2E para os endpoints `/users`

## Detalhes de Implementação

Consultar `techspec.md` — seções:
- "Interfaces Principais > UserRepository"
- "Modelos de Dados > User entity"
- "Sequenciamento > Etapa 1 — Users"
- "Abordagem de Testes" (estratégia de mocks e configuração)

Consultar `clean-ddd-hexagonal.md` — seções:
- "7. Regras de Implementação por Camada" (exemplos de User entity, Repository, Mapper, Use Case, Controller)
- "9. Integração com NestJS > Binding de Port para Adapter no Module"

## Critérios de Sucesso

- Todos os endpoints `/users` respondem com os mesmos contratos da implementação anterior
- `npm run test:unit` passa para todos os use cases de Users
- `npm run test:integration` passa para `TypeOrmUserRepository`
- `npm run test:e2e` passa para os fluxos de `/users`
- `src/users/` removido sem erros de build

## Testes da Tarefa

- [x] `CreateUserUseCase.spec.ts` — happy path, email duplicado, username duplicado
- [x] `UpdateUserUseCase.spec.ts` — happy path, usuário não encontrado
- [x] `UpdatePasswordUseCase.spec.ts` — happy path, senha atual inválida, usuário não encontrado
- [x] `DeleteUserUseCase.spec.ts` — happy path, usuário não encontrado
- [x] `FindUsersUseCase.spec.ts` — happy path com e sem query
- [x] `typeorm-user.repository.integration.spec.ts` — save, findById, findByEmail, findByUsername, findMany, delete
- [x] `users.e2e-spec.ts` — POST, GET, PATCH, DELETE completos

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/users/` (implementação legada — referência e depois remoção)
- `src/modules/users/` (novo destino)
- `src/app.module.ts`