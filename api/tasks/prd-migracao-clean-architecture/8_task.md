# Tarefa 8.0: Migração do Módulo Blocks

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Migrar o módulo de bloqueios de usuários. Módulo simples. Depende do módulo Users migrado (Tarefa 2.0).

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — Block entity e repository port
- `nestjs-best-practices` — BlocksModule
- `nestjs-testing-expert` — unit tests de use cases
</skills>

<requirements>
- Domain entity `Block` com campos: blockerId, blockedId, createdAt
- `BlockRepository` port com métodos: `findByBlockerAndBlocked`, `findByBlocker`, `save`, `delete`
- Use cases: `BlockUserUseCase`, `UnblockUserUseCase`, `ListBlocksUseCase`
- `BlockUserUseCase` impede bloquear a si mesmo; bloquear usuário já bloqueado não gera erro (idempotente)
- `BlocksController` com endpoints: `POST /blocks/:id`, `DELETE /blocks/:id`, `GET /blocks`
- Remover `src/blocks/` ao final
- Contratos de API preservados
</requirements>

## Subtarefas

- [x] 8.1 Criar domain entity `Block`
- [x] 8.2 Criar `BlockRepository` port
- [x] 8.3 Criar ORM entity, mapper e `TypeOrmBlockRepository`
- [x] 8.4 Criar `BlockUserUseCase`, `UnblockUserUseCase` e `ListBlocksUseCase`
- [x] 8.5 Criar `BlocksController` e DTOs
- [x] 8.6 Criar `BlocksModule` com bindings e registrar no `app.module.ts`
- [x] 8.7 Remover `src/blocks/` e validar build
- [x] 8.8 Escrever testes unitários para todos os use cases
- [x] 8.9 Escrever testes de integração para `TypeOrmBlockRepository`
- [x] 8.10 Escrever testes E2E para os fluxos de blocks

## Detalhes de Implementação

Consultar `techspec.md` — seção "Sequenciamento > Etapa 7 — Blocks".

Consultar `business_rules.md` — seção "8. Bloqueios".

## Critérios de Sucesso

- Não é possível bloquear a si mesmo (retorna erro)
- Bloquear usuário já bloqueado não gera erro
- `npm run test:unit` passa para todos os use cases de Blocks
- `npm run test:e2e` passa para os fluxos de Blocks
- `src/blocks/` removido sem erros de build

## Testes da Tarefa

- [ ] `block-user.use-case.spec.ts` — happy path, bloquear a si mesmo (erro), bloquear já bloqueado (idempotente)
- [ ] `unblock-user.use-case.spec.ts` — happy path, usuário não estava bloqueado
- [ ] `list-blocks.use-case.spec.ts` — retorna lista paginada
- [ ] Testes de integração para `TypeOrmBlockRepository`
- [ ] `blocks.e2e-spec.ts` — bloquear → listar → desbloquear

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/blocks/` (implementação legada — referência e depois remoção)
- `src/modules/blocks/` (novo destino)
- `src/modules/users/domain/repositories/user.repository.ts` (dependência)
- `src/app.module.ts`