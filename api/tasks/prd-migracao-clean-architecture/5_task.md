# Tarefa 5.0: Migração do Módulo Posts

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Migrar o módulo de posts, comentários, curtidas e mídias. O feed filtra posts por seguidores. Depende do módulo Users (Tarefa 2.0) e Animals (Tarefa 4.0) para marcação de pets nos posts.

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — Post como AggregateRoot, repository ports para cada entidade
- `nestjs-best-practices` — PostsModule com controllers separados (posts, comments)
- `nestjs-testing-expert` — unit tests com mocks, integration tests de repository
</skills>

<requirements>
- Domain entities: `Post` (AggregateRoot), `Comment`, `Like`, `Media`
- Repository ports: `PostRepository`, `CommentRepository`, `LikeRepository`, `MediaRepository`
- Use cases: `CreatePostUseCase`, `UpdatePostUseCase`, `DeletePostUseCase`, `GetFeedUseCase`, `ToggleLikeUseCase`, `CreateCommentUseCase`, `UpdateCommentUseCase`, `DeleteCommentUseCase`
- `GetFeedUseCase` filtra posts por userId + usuários seguidos (usa `ConnectionRepository` ou recebe lista de IDs)
- `UpdatePostUseCase` remove mídias antigas via `StoragePort` ao substituir
- `DeletePostUseCase` remove todas curtidas, comentários e mídias associados
- Controllers: `PostsController`, `CommentsController`
- Remover `src/posts/` ao final
- Contratos de API preservados
</requirements>

## Subtarefas

- [ ] 5.1 Criar domain entities: `Post`, `Comment`, `Like`, `Media`
- [ ] 5.2 Criar repository ports: `PostRepository`, `CommentRepository`, `LikeRepository`, `MediaRepository`
- [ ] 5.3 Criar ORM entities e mappers
- [ ] 5.4 Criar implementações TypeORM dos repositórios
- [ ] 5.5 Criar use cases de Post (Create, Update, Delete, GetFeed)
- [ ] 5.6 Criar use cases de Like e Comment (ToggleLike, Create/Update/DeleteComment)
- [ ] 5.7 Criar controllers e DTOs
- [ ] 5.8 Criar `PostsModule` com bindings e registrar no `app.module.ts`
- [ ] 5.9 Remover `src/posts/` e validar build
- [ ] 5.10 Escrever testes unitários para todos os use cases
- [ ] 5.11 Escrever testes de integração para repositórios de Posts
- [ ] 5.12 Escrever testes E2E para os fluxos de posts

## Detalhes de Implementação

Consultar `techspec.md` — seções:
- "Sequenciamento > Etapa 4 — Posts"
- "Abordagem de Testes > E2E > Posts"

Consultar `business_rules.md` — seções:
- "4. Posts", "5. Curtidas", "6. Comentários"

## Critérios de Sucesso

- Todos os endpoints de posts respondem com os mesmos contratos
- Feed exibe apenas posts do usuário e de quem ele segue
- `npm run test:unit` passa para todos os use cases de Posts
- `npm run test:integration` passa para os repositórios de Posts
- `npm run test:e2e` passa para os fluxos de Posts
- `src/posts/` removido sem erros de build

## Testes da Tarefa

- [ ] `create-post.use-case.spec.ts` — happy path, sem legenda
- [ ] `get-feed.use-case.spec.ts` — retorna apenas posts de seguidos + próprios
- [ ] `toggle-like.use-case.spec.ts` — curtir, descurtir
- [ ] `create-comment.use-case.spec.ts` — comentário raiz, resposta a comentário, comentário pai não encontrado
- [ ] `update-comment.use-case.spec.ts` — happy path, não é autor
- [ ] `delete-comment.use-case.spec.ts` — happy path, não é autor
- [ ] Testes de integração para `TypeOrmPostRepository`
- [ ] `posts.e2e-spec.ts` — criar → feed → curtir → comentar → editar → excluir

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/posts/` (implementação legada — referência e depois remoção)
- `src/modules/posts/` (novo destino)
- `src/modules/users/domain/repositories/user.repository.ts`
- `src/modules/animals/domain/repositories/animal.repository.ts`
- `src/app.module.ts`