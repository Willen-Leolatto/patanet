# Tarefa 6.0: Migração do Módulo Events

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Migrar o módulo de eventos. Um evento está vinculado a um post — ao criar, um post é gerado automaticamente; ao repostar, o post é restaurado ou recriado. Depende do módulo Posts migrado (Tarefa 5.0).

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — Event entity com regra de vinculação a Post
- `nestjs-best-practices` — EventsModule
- `nestjs-testing-expert` — unit tests com mocks de PostRepository e EventRepository
</skills>

<requirements>
- Domain entity `Event` com campos: título, descrição, data, horário, endereço, coordenadas, imagem, postId vinculado
- `EventRepository` port com métodos: `findById`, `findByAuthor`, `findAll`, `save`, `delete`
- Use cases: `CreateEventUseCase`, `UpdateEventUseCase`, `RepostEventUseCase`, `DeleteEventUseCase`, `ListEventsUseCase`
- `CreateEventUseCase` cria o post vinculado automaticamente (título como legenda, imagem como mídia)
- `UpdateEventUseCase` atualiza o post vinculado; remove imagem anterior via `StoragePort` se substituída
- `RepostEventUseCase`: se post ainda existe, não cria novo; se foi excluído, cria novo post
- `DeleteEventUseCase` remove o evento e o post vinculado (com todas suas mídias)
- `ListEventsUseCase` é público (sem autenticação necessária)
- Remover `src/events/` ao final
- Contratos de API preservados
</requirements>

## Subtarefas

- [ ] 6.1 Criar domain entity `Event`
- [ ] 6.2 Criar `EventRepository` port
- [ ] 6.3 Criar ORM entity, mapper e `TypeOrmEventRepository`
- [ ] 6.4 Criar `CreateEventUseCase` e `ListEventsUseCase`
- [ ] 6.5 Criar `UpdateEventUseCase`, `RepostEventUseCase` e `DeleteEventUseCase`
- [ ] 6.6 Criar `EventsController` e DTOs
- [ ] 6.7 Criar `EventsModule` com bindings e registrar no `app.module.ts`
- [ ] 6.8 Remover `src/events/` e validar build
- [ ] 6.9 Escrever testes unitários para todos os use cases
- [ ] 6.10 Escrever testes de integração para `TypeOrmEventRepository`
- [ ] 6.11 Escrever testes E2E para os fluxos de events

## Detalhes de Implementação

Consultar `techspec.md` — seções:
- "Sequenciamento > Etapa 5 — Events"

Consultar `business_rules.md` — seção "9. Eventos" (criação automática de post, repostagem, regra de post excluído).

## Critérios de Sucesso

- Criar um evento gera automaticamente um post vinculado no feed
- Repostagem restaura o post (ou cria novo se excluído), sem duplicar o evento
- Listagem de eventos é acessível sem autenticação
- `npm run test:unit` passa para todos os use cases de Events
- `npm run test:e2e` passa para os fluxos de Events
- `src/events/` removido sem erros de build

## Testes da Tarefa

- [ ] `create-event.use-case.spec.ts` — happy path (com e sem imagem), título vazio
- [ ] `update-event.use-case.spec.ts` — happy path, não é autor, substituição de imagem
- [ ] `repost-event.use-case.spec.ts` — post ainda existe (não recria), post excluído (cria novo)
- [ ] `delete-event.use-case.spec.ts` — happy path, não é autor
- [ ] `list-events.use-case.spec.ts` — paginação
- [ ] Testes de integração para `TypeOrmEventRepository`
- [ ] `events.e2e-spec.ts` — criar → editar → repostar → excluir

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/events/` (implementação legada — referência e depois remoção)
- `src/modules/events/` (novo destino)
- `src/modules/posts/domain/repositories/post.repository.ts` (dependência)
- `src/app.module.ts`