# Tarefa 3.0: Migração do Módulo Auth

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Migrar o módulo de autenticação para Clean Architecture. Cria o `TokenGeneratorPort` e sua implementação JWT, e os use cases `SignInUseCase` e `RefreshTokenUseCase`. Depende do módulo Users já migrado (Tarefa 2.0).

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — padrão Port/Adapter para `TokenGeneratorPort`
- `nestjs-best-practices` — configuração de JwtModule no AuthModule
- `nestjs-testing-expert` — unit tests de use cases com mocks de ports
</skills>

<requirements>
- Abstract class `TokenGeneratorPort` com métodos: `generateAccessToken`, `generateRefreshToken`, `verifyRefreshToken`
- `JwtTokenGeneratorAdapter` implementando `TokenGeneratorPort` usando `@nestjs/jwt`
- `SignInUseCase`: recebe username + password, verifica via `UserRepository` e `HashingPort`, retorna accessToken + refreshToken
- `RefreshTokenUseCase`: lê o `refresh-token` do header (comportamento mantido), verifica e gera novo par de tokens
- `AuthController` atualizado para chamar os use cases
- `AuthModule` com bindings `{ provide: TokenGeneratorPort, useClass: JwtTokenGeneratorAdapter }`
- `accessToken` expira em 1h, `refreshToken` em 1d (mantido igual ao atual)
- Remover `src/auth/` ao final
- Contratos de API preservados: `POST /auth/session` e `POST /auth/refresh`
</requirements>

## Subtarefas

- [x] 3.1 Criar `src/modules/auth/application/ports/token-generator.port.ts`
- [x] 3.2 Criar `src/modules/auth/infrastructure/jwt/jwt-token-generator.adapter.ts`
- [x] 3.3 Criar `SignInUseCase`
- [x] 3.4 Criar `RefreshTokenUseCase`
- [x] 3.5 Criar `AuthController` e DTOs de request/response
- [x] 3.6 Criar `AuthModule` com bindings e registrar no `app.module.ts`
- [x] 3.7 Remover `src/auth/` e validar build
- [x] 3.8 Escrever testes unitários para `SignInUseCase` e `RefreshTokenUseCase`
- [x] 3.9 Escrever testes E2E para `/auth/session` e `/auth/refresh`

## Detalhes de Implementação

Consultar `techspec.md` — seções:
- "Interfaces Principais > TokenGeneratorPort"
- "Pontos de Integração > JWT"
- "Sequenciamento > Etapa 2 — Auth"

## Critérios de Sucesso

- `POST /auth/session` retorna accessToken e refreshToken com os mesmos contratos
- `POST /auth/refresh` lê o header `refresh-token` e retorna novo par de tokens
- `npm run test:unit` passa para os use cases de Auth
- `npm run test:e2e` passa para os fluxos de Auth
- `src/auth/` removido sem erros de build

## Testes da Tarefa

- [x] `sign-in.use-case.spec.ts` — happy path, usuário não encontrado, senha inválida
- [x] `refresh-token.use-case.spec.ts` — happy path, token inválido/expirado
- [x] `auth.e2e-spec.ts` — fluxo signup → login → uso de token → refresh → uso de novo token

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/auth/` (implementação legada — referência e depois remoção)
- `src/modules/auth/` (novo destino)
- `src/modules/users/domain/repositories/user.repository.ts` (dependência)
- `src/app.module.ts`