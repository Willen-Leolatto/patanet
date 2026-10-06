# PRD — Migração para Clean Architecture + DDD + Hexagonal

## Visão Geral

A API do Patanet está estruturada em módulos NestJS com um padrão flat (`controller → service → repository`), onde lógica de negócio, infraestrutura e apresentação coexistem nos mesmos arquivos `*.service.ts`. Esse modelo torna o projeto difícil de testar, evoluir e manter com segurança.

Esta iniciativa visa reorganizar toda a API aplicando **Clean Architecture**, **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal (Ports & Adapters)**, sem quebrar nenhum contrato de API existente. Os clientes da API (mobile, web) não devem perceber nenhuma mudança.

O beneficiário primário é o **time de desenvolvimento**, que passa a ter um código testável, com separação clara de responsabilidades e base sólida para evoluções futuras.

---

## Objetivos

- Separar completamente a lógica de negócio da infraestrutura e da camada HTTP em todos os módulos da API.
- Garantir que **zero endpoints existentes** sejam quebrados — mesmos URLs, métodos, payloads e códigos de resposta HTTP.
- Atingir **cobertura de testes ≥ 80%** nos use cases, repositórios e fluxos E2E ao final da migração.
- Eliminar dependências de ORM, frameworks e libs de infraestrutura da camada de domínio.
- Estabelecer um padrão arquitetural replicável que sirva de referência para novas funcionalidades.
- Ter `npm run lint` e `npm run build` passando sem erros após cada etapa da migração.

---

## Histórias de Usuário

### Desenvolvedor

- Como desenvolvedor, quero escrever testes unitários para regras de negócio **sem precisar de banco de dados**, para que o ciclo de feedback seja rápido e confiável.
- Como desenvolvedor, quero que cada caso de uso tenha um único ponto de entrada com responsabilidade clara, para que seja fácil entender o que o sistema faz ao ler o código.
- Como desenvolvedor, quero poder substituir o banco de dados (TypeORM/MySQL) por qualquer outro mecanismo de persistência **sem tocar na lógica de domínio**, para que a arquitetura permaneça flexível.
- Como desenvolvedor, quero que as regras de negócio do Patanet (tutores, pets, eventos, suporte) estejam expressas em entidades e serviços de domínio, e não espalhadas em services de infraestrutura.
- Como desenvolvedor, quero que o código novo siga convenções de nomenclatura e estrutura de diretórios padronizadas, para que a navegação no projeto seja previsível.

### Time de produto / QA

- Como membro do time, quero que todos os comportamentos existentes continuem funcionando após a migração, para que não haja regressões percebidas por usuários finais.
- Como QA, quero que cada fluxo principal (autenticação, gestão de pets, feed, eventos, tickets, denúncias) esteja coberto por testes E2E automatizados.

---

## Funcionalidades Principais

### 1. Camada de Domínio por módulo

Cada módulo de negócio passa a ter uma camada de domínio com:

- **Entidades de domínio** puras (sem decorators de ORM), com identidade, estado e comportamento de negócio.
- **Interfaces de repositório** (ports) que definem contratos de persistência sem implementação.
- **Serviços de domínio** para regras que envolvem múltiplas entidades do mesmo contexto (ex: gestão de tutores do pet).

Módulos cobertos: `users`, `auth`, `animals`, `posts`, `events`, `connections`, `blocks`, `reports`, `support`.

### 2. Camada de Aplicação com Use Cases

Cada operação do sistema passa a ter um use case dedicado que:

- Orquestra o domínio e os ports.
- Recebe uma entrada tipada e retorna uma saída tipada.
- Não conhece HTTP, NestJS, TypeORM ou qualquer detalhe de infraestrutura.

Exemplos de use cases mapeados pelo sistema de regras de negócio:

| Módulo | Use Cases |
|---|---|
| Users | Criar, atualizar perfil, alterar senha, excluir conta, buscar usuários |
| Auth | Login, refresh de token |
| Animals | Criar pet, editar, excluir, gerenciar tutores, controlar visibilidade, registros de saúde (vacinas, vermifugações, medicamentos) |
| Posts | Criar post, editar, excluir, feed, curtir/descurtir, comentar, editar/excluir comentário |
| Events | Criar evento, editar, repostar, excluir, listar |
| Connections | Seguir, deixar de seguir, listar seguidores/seguidos |
| Blocks | Bloquear, desbloquear, listar bloqueados |
| Reports | Criar denúncia, listar próprias, atualizar status (admin) |
| Support | Abrir ticket, enviar mensagem, listar próprios, atualizar status (admin) |

### 3. Camada de Infraestrutura

Para cada módulo, a infraestrutura deve fornecer:

- **ORM entities** (TypeORM com decorators) separadas das entidades de domínio.
- **Implementações de repositório** que satisfazem os contratos de domínio.
- **Mappers** que convertem entre ORM entities e domain entities.

### 4. Ports compartilhados (Shared Kernel)

Os ports globais utilizados por múltiplos módulos devem ser centralizados:

- **HashingPort**: contrato para hash e comparação de senhas (já existe parcialmente).
- **StoragePort**: contrato para upload e remoção de arquivos (S3/MinIO).
- **Paginação**: DTOs compartilhados de request e response de paginação.

### 5. Pirâmide de testes implementada

A migração é considerada concluída por módulo somente quando os três tipos de teste estiverem presentes:

- **Unit tests**: todos os use cases e entidades de domínio, com mocks dos ports.
- **Integration tests**: repositórios TypeORM testados contra banco de dados real.
- **E2E tests**: fluxos principais da API testados via HTTP com banco real.

### 6. Camada de apresentação desacoplada

Os controllers NestJS devem:

- Apenas validar entrada (via DTOs com class-validator) e delegar ao use case correspondente.
- Não conter lógica de negócio.
- Serializar saída usando DTOs de resposta (class-transformer).

---

## Experiência do Usuário

### Persona: Desenvolvedor do time Patanet

**Necessidades:**
- Encontrar rapidamente onde uma regra de negócio está implementada.
- Escrever um novo caso de uso sem precisar entender detalhes de ORM ou HTTP.
- Adicionar um teste unitário sem configurar banco de dados ou servidor HTTP.
- Ter confiança para refatorar sem medo de quebrar comportamentos existentes.

**Fluxo esperado após a migração:**

1. Desenvolvedor precisa alterar a regra de transferência de tutor principal de um pet.
2. Navega diretamente para `src/modules/animals/domain/services/tutor-management.domain-service.ts`.
3. Altera a regra no domínio e executa os unit tests do use case afetado.
4. Não precisa subir banco de dados para validar a lógica.
5. Roda os E2E para confirmar que o contrato de API não foi quebrado.

---

## Restrições Técnicas de Alto Nível

- **Contratos de API imutáveis**: todos os endpoints (URLs, métodos HTTP, códigos de resposta) e payloads de entrada/saída permanecem idênticos ao atual.
- **Stack fixa**: NestJS, TypeORM, MySQL, AWS S3/MinIO, JWT, bcryptjs, class-validator, class-transformer, Zod, Jest.
- **Migrations existentes não são alteradas**: o schema do banco de dados não muda.
- **Migração incremental**: cada módulo deve continuar funcional durante e após sua migração. Não é permitido quebrar módulos ainda não migrados.
- **Injeção de dependência via NestJS**: os bindings entre ports e adapters são feitos nos módulos NestJS.
- **Banco de dados de teste isolado**: os testes de integração e E2E devem rodar contra um banco separado do de desenvolvimento.
- **Sem `any` não justificado** nas camadas de domínio e aplicação.

---

## Fora de Escopo

- Alteração de qualquer contrato de API existente (rotas, payloads, status HTTP).
- Mudanças no schema do banco de dados ou nas migrations.
- Migração para outro ORM, banco de dados ou cloud provider.
- Introdução de novas funcionalidades de negócio durante a migração.
- Refatoração de infraestrutura de CI/CD ou Docker além do necessário para suportar o banco de testes.
- Implementação de Domain Events ou Event Sourcing (reservado para evolução futura após a migração base).
- Implementação de Value Objects formais (ex: `Email`, `Username`) como fase inicial — são opcionais e podem ser adicionados incrementalmente.
- Documentação de API (Swagger/OpenAPI) — não é parte desta iniciativa.