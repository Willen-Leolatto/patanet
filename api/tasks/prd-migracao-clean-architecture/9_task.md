# Tarefa 9.0: Migração do Módulo Reports

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Migrar o módulo de denúncias. Inclui enums de status e categoria, e restrição de acesso admin para alterar status. Depende do módulo Users migrado (Tarefa 2.0).

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — Report entity com enums, repository port
- `nestjs-best-practices` — uso de AdminGuard no controller
- `nestjs-testing-expert` — unit tests com controle de acesso
</skills>

<requirements>
- Domain entity `Report` com enums: `ReportStatus` (Aberta, Em análise, Resolvida, Rejeitada) e `ReportCategory` (geral, CSAM, abuso animal)
- `ReportRepository` port com métodos: `findById`, `findByReporter`, `findAll`, `save`
- Use cases: `CreateReportUseCase`, `ListMyReportsUseCase`, `UpdateReportStatusUseCase`
- `UpdateReportStatusUseCase` é restrito a administradores (verificação feita no controller via `AdminGuard`)
- É possível anexar arquivos como evidência (upload via `StoragePort` no controller)
- `ReportsController` com endpoints: `POST /reports`, `GET /reports/mine`, `PATCH /reports/:id/status`
- Remover `src/reports/` ao final
- Contratos de API preservados
</requirements>

## Subtarefas

- [x] 9.1 Criar domain entity `Report` com enums `ReportStatus` e `ReportCategory`
- [x] 9.2 Criar `ReportRepository` port
- [x] 9.3 Criar ORM entity, mapper e `TypeOrmReportRepository`
- [x] 9.4 Criar `CreateReportUseCase`, `ListMyReportsUseCase` e `UpdateReportStatusUseCase`
- [x] 9.5 Criar `ReportsController` e DTOs (usando `AdminGuard` em `PATCH /reports/:id/status`)
- [x] 9.6 Criar `ReportsModule` com bindings e registrar no `app.module.ts`
- [x] 9.7 Remover `src/reports/` e validar build
- [x] 9.8 Escrever testes unitários para todos os use cases
- [x] 9.9 Escrever testes de integração para `TypeOrmReportRepository`
- [x] 9.10 Escrever testes E2E para os fluxos de reports

## Detalhes de Implementação

Consultar `techspec.md` — seção "Sequenciamento > Etapa 8 — Reports".

Consultar `business_rules.md` — seção "10. Denúncias".

## Critérios de Sucesso

- Usuário comum só visualiza as próprias denúncias
- Apenas admin pode alterar status (endpoint retorna 403 para usuário comum)
- `npm run test:unit` passa para todos os use cases de Reports
- `npm run test:e2e` passa para os fluxos de Reports
- `src/reports/` removido sem erros de build

## Testes da Tarefa

- [x] `create-report.use-case.spec.ts` — happy path, campos obrigatórios ausentes
- [x] `list-my-reports.use-case.spec.ts` — retorna apenas denúncias do próprio usuário
- [x] `update-report-status.use-case.spec.ts` — happy path, denúncia não encontrada
- [x] Testes de integração para `TypeOrmReportRepository`
- [x] `reports.e2e-spec.ts` — criar → listar próprias → admin atualiza status; usuário comum tenta atualizar status (403)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/reports/` (implementação legada — referência e depois remoção)
- `src/modules/reports/` (novo destino)
- `src/shared/presentation/guards/admin.guard.ts` (movido na Tarefa 1.0)
- `src/app.module.ts`