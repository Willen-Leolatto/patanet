# Tarefa 1.0: Preparação e Infraestrutura Base

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Etapa 0 da migração: mover as base classes DDD de `src/core/` para `src/shared/domain/`, criar os ports compartilhados (`HashingPort`, `StoragePort`) e seus adapters, configurar o `SharedModule` global, adicionar path aliases no tsconfig, criar o banco de teste no docker-compose e montar toda a infraestrutura de testes (helpers, configurações Jest, scripts npm). Nenhuma lógica de negócio é alterada nesta etapa.

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — estrutura de diretórios alvo, convenções de nomenclatura e padrão Port/Adapter
- `nestjs-best-practices` — padrão de `@Global()` module, injeção de dependência com abstract class
- `nestjs-testing-expert` — configuração de jest-integration.json, jest-e2e.json e helpers de teste
</skills>

<requirements>
- Mover `src/core/entities/entity.ts` → `src/shared/domain/entity.ts`
- Mover `src/core/entities/aggregate-root.ts` → `src/shared/domain/aggregate-root.ts`
- Mover `src/core/entities/value-object.ts` → `src/shared/domain/value-object.ts`
- Mover `src/core/entities/unique-entity-id.ts` → `src/shared/domain/unique-entity-id.ts`
- Mover `src/core/entities/watched-list.ts` → `src/shared/domain/watched-list.ts`
- Mover `src/core/events/` → `src/shared/domain/events/` (domain-events.ts, domain-event.ts, event-handler.ts)
- Criar `src/shared/application/ports/hashing.port.ts` (abstract class HashingPort)
- Criar `src/shared/application/ports/storage.port.ts` (abstract class StoragePort)
- Criar `src/shared/infrastructure/hashing/bcrypt-hashing.adapter.ts` (renomear BcryptHashingService)
- Criar `src/shared/infrastructure/storage/s3-storage.adapter.ts` (extrair de UploadService)
- Criar `src/shared/shared.module.ts` com `@Global()`, exportando HashingPort e StoragePort
- Mover `src/common/guards/admin.guard.ts` → `src/shared/presentation/guards/admin.guard.ts`
- Configurar path aliases no `tsconfig.json`: `@shared/*`, `@modules/*`, `@core/*`
- Adicionar serviço `mysql-test` (porta 3307) no `docker-compose.yml`
- Criar `test/e2e/helpers/app.helper.ts`
- Criar `test/e2e/helpers/auth.helper.ts`
- Criar `test/e2e/helpers/database.helper.ts`
- Criar `test/jest-integration.json`
- Criar `test/jest-e2e.json`
- Adicionar scripts `test:unit`, `test:integration`, `test:e2e`, `test:all` ao `package.json`
- Atualizar `src/app.module.ts`: remover `UploadModule`, importar `SharedModule`
- `npm run build` e `npm run lint` devem passar sem erros ao final
</requirements>

## Subtarefas

- [x] 1.1 Mover base classes DDD de `src/core/` para `src/shared/domain/` e atualizar todos os imports existentes
- [x] 1.2 Criar `HashingPort` e `BcryptHashingAdapter` (renomear `BcryptHashingService`)
- [x] 1.3 Criar `StoragePort` e `S3StorageAdapter` (extrair lógica de `UploadService`)
- [x] 1.4 Criar `SharedModule` global com bindings de HashingPort e StoragePort
- [x] 1.5 Mover `AdminGuard` para `src/shared/presentation/guards/`
- [x] 1.6 Configurar path aliases `@shared/*` e `@modules/*` no `tsconfig.json` e `tsconfig.build.json`
- [x] 1.7 Adicionar serviço `mysql-test` no `docker-compose.yml`
- [x] 1.8 Criar helpers de teste (`app.helper.ts`, `auth.helper.ts`, `database.helper.ts`)
- [x] 1.9 Criar `test/jest-integration.json` e `test/jest-e2e.json`
- [x] 1.10 Atualizar `package.json` com scripts de teste e validar `npm run build` + `npm run lint`

## Detalhes de Implementação

Consultar `techspec.md` — seções:
- "Arquitetura do Sistema > Novos / Modificados"
- "Configurações Específicas" (docker-compose, tsconfig, package.json, jest configs)
- "Arquivos que serão criados (Etapa 0)" e "Arquivos modificados (Etapa 0)"

## Critérios de Sucesso

- `npm run build` passa sem erros
- `npm run lint` passa sem erros
- Todos os imports de `@core/*` nos arquivos existentes foram atualizados para `@shared/domain/*`
- `SharedModule` registrado como global no `app.module.ts`
- `docker-compose.yml` contém o serviço `mysql-test` na porta 3307
- Arquivos de configuração Jest criados em `test/`
- Scripts de teste adicionados ao `package.json`

## Testes da Tarefa

- [x] Testes de unidade para `BcryptHashingAdapter` (hash e compare)
- [x] Testes de unidade para `S3StorageAdapter` (upload e delete com mocks do SDK)
- [x] Validar `npm run test:unit` executa sem erros

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/core/` (origem dos arquivos a serem movidos)
- `src/common/hashing/bcrypt-hashing.service.ts` (a ser renomeado/movido)
- `src/upload/upload.service.ts` (lógica a ser extraída para S3StorageAdapter)
- `src/common/guards/admin.guard.ts` (a ser movido)
- `src/app.module.ts`
- `tsconfig.json` e `tsconfig.build.json`
- `docker-compose.yml`
- `package.json`