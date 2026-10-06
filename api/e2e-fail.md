# Análise de Falhas nos Testes E2E

> Executado em: 2026-05-12  
> Suítes analisadas: 8 | Falhando: 4 | Passando: 4  
> Testes falhando: 16 de 108

---

## Visão Geral

Todas as falhas foram reproduzidas e diagnosticadas. Os problemas se dividem em três categorias distintas:

| # | Suíte | Testes falhando | Causa | Falha em isolamento? |
|---|-------|-----------------|-------|---------------------|
| 1 | `connections.e2e-spec.ts` | 6 | Bug no código de teste | **Sim** |
| 2 | `reports.e2e-spec.ts` | 3 | Conflito de email estático em execução paralela | Não |
| 3 | `support.e2e-spec.ts` | 3 | Conflito de email estático em execução paralela | Não |
| 4 | `posts.e2e-spec.ts` | 4 | Race condition com cleanup global do `events.e2e-spec.ts` | Não |

---

## Problema 1 — `connections.e2e-spec.ts` (6 testes, falha sempre)

### Sintoma
```
● POST /connections/follow/:id › follows a user and returns 201
  Expected: 201
  Received: 500

QueryFailedError: Cannot add or update a child row: a foreign key constraint fails
  (connections, FK (followed_id) REFERENCES users (id))

sql: INSERT INTO connections(followed_id) VALUES ('undefined', ...)
```

### Causa raiz
O `POST /users` controller **não retorna o body** com o usuário criado — o método retorna `void`:

```typescript
// src/modules/users/presentation/controllers/users.controller.ts
async create(...) {
  await this.createUserUseCase.execute(createUserDto) // sem return
}
```

O teste tenta obter o `userBId` da resposta desse endpoint:

```typescript
// test/e2e/connections.e2e-spec.ts — beforeAll
const resB = await request(app.getHttpServer()).post('/users')...
userBId = resB.body.id // ← undefined, pois o body está vazio
```

Como `userBId` é `undefined` (JavaScript), quando passado como parâmetro de rota, se torna a string literal `"undefined"`. O `FollowUseCase` **não valida se o usuário alvo existe** e tenta inserir a conexão diretamente, causando violação de FK no banco.

**Causa secundária no código de produção**: `FollowUseCase` não verifica se o usuário a seguir existe antes de persistir, deveria lançar `NotFoundException`.

### Solução

**No teste** — usar `/users/me` após o login para obter o ID, exatamente como faz o `blocks.e2e-spec.ts`:

```typescript
// beforeAll — trocar de:
const resB = await request(app.getHttpServer()).post('/users')...
userBId = resB.body.id

// para:
await request(app.getHttpServer()).post('/users')...
const loginB = await request(app.getHttpServer())
  .post('/auth/session')
  .send({ username: userB.username, password: userB.password })
tokenB = loginB.body.access_token

const meB = await request(app.getHttpServer())
  .get('/users/me')
  .set('Authorization', `Bearer ${tokenB}`)
userBId = meB.body.id
```

**No código de produção** — adicionar validação de existência do usuário no `FollowUseCase`:

```typescript
// src/modules/connections/application/use-cases/follow.use-case.ts
async execute(input: FollowInput): Promise<void> {
  if (input.followerId === input.followingId) {
    throw new BadRequestException('You cannot follow yourself')
  }

  // ← adicionar validação:
  const targetUser = await this.userRepository.findById(input.followingId)
  if (!targetUser) throw new NotFoundException('User not found')

  // ... restante do código
}
```

---

## Problema 2 — `reports.e2e-spec.ts` e `support.e2e-spec.ts` (3 testes cada, falha em paralelo)

### Sintoma
```
● PATCH /reports/:id/status › admin can update report status
  Expected: 200
  Received: 401

● PATCH /support/:id/status › admin can update ticket status
  Expected: 200
  Received: 401
```

### Causa raiz
Ambas as suítes registram o usuário admin com o **mesmo email estático** `admin@test.com`:

```typescript
// reports.e2e-spec.ts linha 29
const adminUser = { email: 'admin@test.com', username: `reports_e2e_admin_${ts}`, ... }

// support.e2e-spec.ts linha 28
const adminUser = { email: 'admin@test.com', username: `support_e2e_admin_${ts}`, ... }
```

O Jest executa as suítes em paralelo (múltiplos workers). Ambas tentam registrar `admin@test.com` simultaneamente em seus `beforeAll`. A primeira registra com sucesso; a segunda recebe `409 Conflict` (email duplicado), mas o teste não verifica esse status.

Em seguida, a suíte perdedora tenta fazer login com seu username dinâmico (ex: `support_e2e_admin_1747000000000`), que **nunca foi criado**. O login retorna sem `access_token`, então `tokenAdmin = undefined`. Todas as chamadas com `Authorization: Bearer undefined` são rejeitadas com `401`.

### Solução

Tornar o email do admin dinâmico por timestamp (assim como os demais usuários) em ambas as suítes, **e configurar o ADMIN_EMAILS no próprio teste**:

```typescript
// Em ambas as suítes — trocar o email estático:
const adminUser = {
  email: `admin_${ts}@test.com`, // ← dinâmico
  username: `reports_e2e_admin_${ts}`,
  ...
}
```

E setar a variável de ambiente antes do `beforeAll`:

```typescript
beforeAll(async () => {
  process.env.ADMIN_EMAILS = adminUser.email // ← garantir que o guard aceite
  app = await createApp()
  // ...
})
```

**Alternativa mais simples**: adicionar `"runInBand": true` ao `test/jest-e2e.json` para executar as suítes sequencialmente. Com execução sequencial, a primeira suíte cria e deleta o `admin@test.com`, e a segunda cria novamente sem conflito:

```json
// test/jest-e2e.json
{
  "runInBand": true,
  ...
}
```

---

## Problema 3 — `posts.e2e-spec.ts` (4 testes, falha em paralelo)

### Sintoma
```
● POST /posts/comment/:id › creates a comment on a post
  Expected: 201
  Received: 500   ← race condition

● PATCH /posts/:postId/comment/:commentId › updates a comment
  Expected: 200
  Received: 404   ← cascade: commentId é undefined pois o teste anterior falhou
```

### Causa raiz
O `afterAll` do `events.e2e-spec.ts` apaga **todos** os posts e comentários do banco:

```typescript
// test/e2e/events.e2e-spec.ts — afterAll
await dataSource.query('SET FOREIGN_KEY_CHECKS=0')
await dataSource.query('DELETE FROM comments WHERE 1=1') // ← apaga TODOS os comentários
await dataSource.query('DELETE FROM posts WHERE 1=1')    // ← apaga TODOS os posts
await dataSource.query('SET FOREIGN_KEY_CHECKS=1')
```

Quando a suíte de events termina durante a execução paralela, ela elimina os posts que a suíte de posts ainda está usando. A sequência da race condition:

1. `posts.e2e-spec.ts` obtém o `postId` no teste `GET /posts/me`
2. `events.e2e-spec.ts` termina → `afterAll` executa `DELETE FROM posts WHERE 1=1`
3. `posts.e2e-spec.ts` tenta `POST /posts/comment/${postId}`:
   - `postRepository.findById(postId)` ainda pode encontrar o post (janela de tempo)
   - Mas o `INSERT INTO comments (post_id = ...)` falha por FK (post foi deletado entre as duas queries) → **500**
4. `commentId` nunca é definido → todos os testes seguintes falham com 404

**Nota**: O `posts.e2e-spec.ts` tem o mesmo problema em seu próprio `afterAll` (DELETE FROM posts WHERE 1=1), o que poderia afetar outras suítes se elas dependessem de posts globais.

### Solução

Restringir o cleanup de events para deletar apenas os registros criados pela própria suíte, não todos os registros da tabela:

```typescript
// test/e2e/events.e2e-spec.ts — afterAll
// Trocar cleanup global por cleanup específico da suíte:
await dataSource.query('DELETE FROM events WHERE 1=1')
await dataSource
  .getRepository(UserOrmEntity)
  .delete({ email: testUser.email })
// Remover os DELETEs globais de posts e comments (que não pertencem a esta suíte)
```

O `posts.e2e-spec.ts` também deve ser corrigido da mesma forma:

```typescript
// test/e2e/posts.e2e-spec.ts — afterAll
// Remover:
// await dataSource.query('DELETE FROM medias WHERE 1=1')
// await dataSource.query('DELETE FROM likes WHERE 1=1')
// await dataSource.query('DELETE FROM comments WHERE 1=1')
// await dataSource.query('DELETE FROM posts WHERE 1=1')
// Adicionar: deletar apenas o usuário de teste (posts/comments serão removidos via cascade ou FK)
await dataSource
  .getRepository(UserOrmEntity)
  .delete({ email: testUser.email })
```

**Alternativa**: usar `runInBand: true` no `jest-e2e.json` elimina os problemas de execução paralela.

---

## Resumo das Soluções

| Problema | Solução Específica | Solução Universal |
|----------|-------------------|-------------------|
| `connections` — `userBId` undefined | Usar `GET /users/me` para obter ID; adicionar validação no `FollowUseCase` | — |
| `reports`/`support` — email admin duplicado | Tornar email do admin dinâmico com timestamp + setar `process.env.ADMIN_EMAILS` | `runInBand: true` |
| `posts` — race condition com events cleanup | Restringir DELETE no afterAll do events para deletar só registros próprios | `runInBand: true` |

A adição de `"runInBand": true` ao `test/jest-e2e.json` resolve os problemas 2 e 3 sem alterar código de teste, mas torna a execução mais lenta. Os problemas específicos do código de teste (problema 1) devem ser corrigidos independentemente.