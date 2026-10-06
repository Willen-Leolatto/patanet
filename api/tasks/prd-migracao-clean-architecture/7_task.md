# Tarefa 7.0: Migração do Módulo Connections

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Migrar o módulo de conexões (seguir/deixar de seguir). Módulo simples, sem dependências complexas além de Users. Depende do módulo Users migrado (Tarefa 2.0).

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — Connection entity e repository port
- `nestjs-best-practices` — ConnectionsModule
- `nestjs-testing-expert` — unit tests de use cases
</skills>

<requirements>
- Domain entity `Connection` com campos: followerId, followingId, createdAt
- `ConnectionRepository` port com métodos: `findByFollowerAndFollowing`, `findFollowers`, `findFollowing`, `save`, `delete`
- Use cases: `FollowUseCase`, `UnfollowUseCase`, `ListFollowersUseCase`, `ListFollowingUseCase`
- `FollowUseCase` impede seguir a si mesmo
- `ConnectionsController` com endpoints: `POST /connections/follow/:id`, `DELETE /connections/unfollow/:id`, `GET /connections/followers/:id`, `GET /connections/following/:id`
- Remover `src/connections/` ao final
- Contratos de API preservados
</requirements>

## Subtarefas

- [x] 7.1 Criar domain entity `Connection`
- [x] 7.2 Criar `ConnectionRepository` port
- [x] 7.3 Criar ORM entity, mapper e `TypeOrmConnectionRepository`
- [x] 7.4 Criar `FollowUseCase` e `UnfollowUseCase`
- [x] 7.5 Criar `ListFollowersUseCase` e `ListFollowingUseCase`
- [x] 7.6 Criar `ConnectionsController` e DTOs
- [x] 7.7 Criar `ConnectionsModule` com bindings e registrar no `app.module.ts`
- [x] 7.8 Remover `src/connections/` e validar build
- [x] 7.9 Escrever testes unitários para todos os use cases
- [x] 7.10 Escrever testes de integração para `TypeOrmConnectionRepository`
- [x] 7.11 Escrever testes E2E para os fluxos de connections

## Detalhes de Implementação

Consultar `techspec.md` — seção "Sequenciamento > Etapa 6 — Connections".

Consultar `business_rules.md` — seção "7. Conexões".

## Critérios de Sucesso

- Não é possível seguir a si mesmo (retorna erro)
- Listagem de followers/following funciona com paginação
- `npm run test:unit` passa para todos os use cases de Connections
- `npm run test:e2e` passa para os fluxos de Connections
- `src/connections/` removido sem erros de build

## Testes da Tarefa

- [x] `follow.use-case.spec.ts` — happy path, seguir a si mesmo (erro), já seguindo
- [x] `unfollow.use-case.spec.ts` — happy path, não estava seguindo
- [x] `list-followers.use-case.spec.ts` — retorna lista paginada
- [x] `list-following.use-case.spec.ts` — retorna lista paginada
- [x] Testes de integração para `TypeOrmConnectionRepository`
- [x] `connections.e2e-spec.ts` — seguir → listar → deixar de seguir

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/connections/` (implementação legada — referência e depois remoção)
- `src/modules/connections/` (novo destino)
- `src/modules/users/domain/repositories/user.repository.ts` (dependência)
- `src/app.module.ts`