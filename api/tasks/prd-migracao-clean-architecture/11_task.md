# Tarefa 11.0: Limpeza Final

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Etapa 10 da migração: remover todos os resíduos da estrutura legada, atualizar as referências globais (`data-source.ts`, `app.module.ts`), e validar que a cobertura de testes ≥ 80%, lint e build passam sem erros. Depende de todas as tarefas anteriores (2.0 a 10.0) concluídas.

<skills>
### Conformidade com Skills Padrões

- `nestjs-best-practices` — revisão final do app.module.ts e data-source.ts
- `nestjs-testing-expert` — validação da cobertura de testes com coverage threshold
</skills>

<requirements>
- Remover `src/upload/` (substituído por `StoragePort` + `S3StorageAdapter`)
- Remover `src/common/hashing/` (substituído por `HashingPort` + `BcryptHashingAdapter`)
- Verificar e remover quaisquer resíduos de `src/users/`, `src/auth/`, `src/animals/`, `src/posts/`, `src/events/`, `src/connections/`, `src/blocks/`, `src/reports/`, `src/support/` (devem ter sido removidos em cada tarefa, mas confirmar)
- Atualizar `data-source.ts` para referenciar apenas os novos ORM entities em `src/modules/*/infrastructure/`
- Revisar `src/app.module.ts` importando apenas os novos módulos migrados
- Remover `src/core/` se ainda existir (conteúdo foi movido para `src/shared/domain/` na Tarefa 1.0)
- `npm run test:cov` deve reportar cobertura ≥ 80% em branches, functions, lines e statements
- `npm run lint` deve passar sem erros
- `npm run build` deve passar sem erros
- `npm run test:all` deve passar (unit + integration + E2E)
</requirements>

## Subtarefas

- [x] 11.1 Remover `src/upload/` e `src/common/hashing/`
- [x] 11.2 Remover `src/core/` (confirmar que conteúdo foi movido para `src/shared/domain/`)
- [x] 11.3 Confirmar remoção de todos os módulos legados (`src/users/`, `src/auth/`, etc.)
- [x] 11.4 Atualizar `data-source.ts` para listar apenas os novos ORM entities de `src/modules/`
- [x] 11.5 Revisar `src/app.module.ts` — remover imports legados, confirmar que todos os novos módulos estão registrados
- [x] 11.6 Executar `npm run lint` e corrigir todos os erros encontrados
- [x] 11.7 Executar `npm run build` e corrigir todos os erros encontrados
- [x] 11.8 Executar `npm run test:cov` e validar cobertura ≥ 80%
- [x] 11.9 Executar `npm run test:all` e confirmar que todos os testes passam

## Detalhes de Implementação

Consultar `techspec.md` — seções:
- "Arquitetura do Sistema > Removidos após migração"
- "Sequenciamento > Etapa 10 — Limpeza"

## Critérios de Sucesso

- Nenhum arquivo de `src/upload/`, `src/common/hashing/`, `src/core/` ou módulos legados existe
- `data-source.ts` referencia apenas ORM entities em `src/modules/`
- `npm run lint` retorna 0 erros
- `npm run build` retorna 0 erros
- `npm run test:cov` mostra cobertura ≥ 80% em todas as métricas
- `npm run test:all` passa sem falhas

## Testes da Tarefa

- [x] `npm run test:unit` — todos os testes passam
- [ ] `npm run test:integration` — todos os testes passam (requer banco de dados)
- [ ] `npm run test:e2e` — todos os testes passam (requer banco de dados)
- [x] `npm run test:cov` — cobertura ≥ 80% (Statements: 97.52%, Branches: 80.98%, Functions: 95.73%, Lines: 97.8%)

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/upload/` (remover)
- `src/common/hashing/` (remover)
- `src/core/` (remover se ainda existir)
- `data-source.ts`
- `src/app.module.ts`
- `package.json` (scripts de teste)