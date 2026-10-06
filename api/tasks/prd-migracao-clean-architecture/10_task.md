# Tarefa 10.0: Migração do Módulo Support

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Migrar o módulo de tickets de suporte. Um ticket é um AggregateRoot que contém uma lista de mensagens. Inclui restrição de acesso admin para listar todos os tickets e alterar status. Depende do módulo Users migrado (Tarefa 2.0).

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — SupportTicket como AggregateRoot com SupportTicketMessage
- `nestjs-best-practices` — uso de AdminGuard, SupportModule
- `nestjs-testing-expert` — unit tests com entidade agregada
</skills>

<requirements>
- Domain entities: `SupportTicket` (AggregateRoot) com enums `TicketStatus` (Aberto, Em análise, Resolvido, Fechado) e `TicketCategory` (geral, privacidade, exclusão de conta, outro); `SupportTicketMessage`
- `SupportTicketRepository` port com métodos: `findById`, `findByAuthor`, `findAll`, `save`
- `SupportTicketMessageRepository` port com métodos: `findByTicket`, `save`
- Use cases: `CreateTicketUseCase`, `SendMessageUseCase`, `UpdateTicketStatusUseCase`, `ListMyTicketsUseCase`, `ListAllTicketsUseCase`
- `ListAllTicketsUseCase` e `UpdateTicketStatusUseCase` são restritos a administradores
- É possível anexar arquivos na abertura do ticket (upload via `StoragePort` no controller)
- `SupportController` com endpoints: `POST /support`, `GET /support/mine`, `GET /support/all`, `POST /support/:id/messages`, `PATCH /support/:id/status`
- Remover `src/support/` ao final
- Contratos de API preservados
</requirements>

## Subtarefas

- [ ] 10.1 Criar domain entities `SupportTicket` e `SupportTicketMessage` com enums
- [ ] 10.2 Criar `SupportTicketRepository` e `SupportTicketMessageRepository` ports
- [ ] 10.3 Criar ORM entities, mappers e repositórios TypeORM
- [ ] 10.4 Criar `CreateTicketUseCase` e `ListMyTicketsUseCase`
- [ ] 10.5 Criar `SendMessageUseCase`, `UpdateTicketStatusUseCase` e `ListAllTicketsUseCase`
- [ ] 10.6 Criar `SupportController` e DTOs (com `AdminGuard` nos endpoints restritos)
- [ ] 10.7 Criar `SupportModule` com bindings e registrar no `app.module.ts`
- [ ] 10.8 Remover `src/support/` e validar build
- [ ] 10.9 Escrever testes unitários para todos os use cases
- [ ] 10.10 Escrever testes de integração para os repositórios de Support
- [ ] 10.11 Escrever testes E2E para os fluxos de support

## Detalhes de Implementação

Consultar `techspec.md` — seção "Sequenciamento > Etapa 9 — Support".

Consultar `business_rules.md` — seção "11. Suporte (Tickets)".

## Critérios de Sucesso

- Usuário comum só visualiza os próprios tickets
- Apenas admin acessa `GET /support/all` e `PATCH /support/:id/status`
- Mensagens são exibidas em ordem cronológica
- `npm run test:unit` passa para todos os use cases de Support
- `npm run test:e2e` passa para os fluxos de Support
- `src/support/` removido sem erros de build

## Testes da Tarefa

- [ ] `create-ticket.use-case.spec.ts` — happy path, assunto acima de 120 chars
- [ ] `send-message.use-case.spec.ts` — happy path, ticket não encontrado
- [ ] `update-ticket-status.use-case.spec.ts` — happy path, ticket não encontrado
- [ ] `list-my-tickets.use-case.spec.ts` — retorna apenas tickets do próprio usuário
- [ ] `list-all-tickets.use-case.spec.ts` — retorna todos os tickets paginados
- [ ] Testes de integração para `TypeOrmSupportTicketRepository`
- [ ] `support.e2e-spec.ts` — abrir ticket → enviar mensagem → admin atualiza status; usuário comum tenta acessar /support/all (403)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/support/` (implementação legada — referência e depois remoção)
- `src/modules/support/` (novo destino)
- `src/shared/presentation/guards/admin.guard.ts`
- `src/app.module.ts`