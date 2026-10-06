import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp } from './helpers/app.helper'
import { PrismaService } from '../../src/database/prisma/prisma.service'
import { uniqueSuffix } from './helpers/unique.helper'
import { acceptTerms } from './helpers/auth.helper'

describe('/blocks (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let tokenA: string
  let tokenB: string
  let userAId: string
  let userBId: string

  const ts = uniqueSuffix()
  const userA = {
    name: 'Blocks E2E A',
    username: `blocks_e2e_a_${ts}`,
    email: `blocks_e2e_a_${ts}@example.com`,
    password: 'password123',
  }
  const userB = {
    name: 'Blocks E2E B',
    username: `blocks_e2e_b_${ts}`,
    email: `blocks_e2e_b_${ts}@example.com`,
    password: 'password123',
  }

  beforeAll(async () => {
    app = await createApp()
    prisma = app.get(PrismaService)

    await request(app.getHttpServer())
      .post('/users')
      .field('name', userA.name)
      .field('username', userA.username)
      .field('email', userA.email)
      .field('password', userA.password)

    await request(app.getHttpServer())
      .post('/users')
      .field('name', userB.name)
      .field('username', userB.username)
      .field('email', userB.email)
      .field('password', userB.password)

    const loginA = await request(app.getHttpServer())
      .post('/auth/session')
      .send({ username: userA.username, password: userA.password })
    tokenA = loginA.body.access_token

    const loginB = await request(app.getHttpServer())
      .post('/auth/session')
      .send({ username: userB.username, password: userB.password })
    tokenB = loginB.body.access_token
    await acceptTerms(app, tokenA)
    await acceptTerms(app, tokenB)

    const meA = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
    userAId = meA.body.id

    const meB = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${tokenB}`)
    userBId = meB.body.id
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.block.deleteMany({})
      await prisma.user.deleteMany({ where: { email: userA.email } })
      await prisma.user.deleteMany({ where: { email: userB.email } })
    }
    await app?.close()
  })

  beforeEach(async () => {
    await prisma.block.deleteMany({})
  })

  describe('POST /blocks/:id', () => {
    it('blocks a user and returns 200', async () => {
      const res = await request(app.getHttpServer())
        .post(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).post(`/blocks/${userBId}`)

      expect(res.status).toBe(401)
    })

    it('returns 400 when trying to block yourself', async () => {
      const res = await request(app.getHttpServer())
        .post(`/blocks/${userAId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(400)
    })

    it('is idempotent when blocking an already blocked user', async () => {
      await request(app.getHttpServer())
        .post(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const res = await request(app.getHttpServer())
        .post(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
    })
  })

  describe('GET /blocks', () => {
    it('returns empty list initially', async () => {
      const res = await request(app.getHttpServer())
        .get('/blocks')
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('paginatio')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(0)
      expect(res.body.paginatio.total).toBe(0)
    })

    it('returns blocked users after blocking', async () => {
      await request(app.getHttpServer())
        .post(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const res = await request(app.getHttpServer())
        .get('/blocks')
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].blockedId).toBe(userBId)
      expect(res.body.paginatio.total).toBe(1)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/blocks')

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /blocks/:id', () => {
    it('unblocks a user and returns 200', async () => {
      await request(app.getHttpServer())
        .post(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const res = await request(app.getHttpServer())
        .delete(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
    })

    it('returns 200 when user was not blocked (no-op)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/blocks/${userBId}`,
      )

      expect(res.status).toBe(401)
    })

    it('full flow: block → list → unblock → confirm empty', async () => {
      await request(app.getHttpServer())
        .post(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const afterBlock = await request(app.getHttpServer())
        .get('/blocks')
        .set('Authorization', `Bearer ${tokenA}`)
      expect(afterBlock.body.data).toHaveLength(1)

      await request(app.getHttpServer())
        .delete(`/blocks/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const afterUnblock = await request(app.getHttpServer())
        .get('/blocks')
        .set('Authorization', `Bearer ${tokenA}`)
      expect(afterUnblock.body.data).toHaveLength(0)
    })

    it('tokenB can still block userA independently', async () => {
      await request(app.getHttpServer())
        .post(`/blocks/${userAId}`)
        .set('Authorization', `Bearer ${tokenB}`)

      const res = await request(app.getHttpServer())
        .get('/blocks')
        .set('Authorization', `Bearer ${tokenB}`)

      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].blockedId).toBe(userAId)
    })
  })
})
