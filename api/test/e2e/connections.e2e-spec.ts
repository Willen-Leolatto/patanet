import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp } from './helpers/app.helper'
import { PrismaService } from '../../src/database/prisma/prisma.service'
import { uniqueSuffix } from './helpers/unique.helper'
import { acceptTerms } from './helpers/auth.helper'

describe('/connections (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let tokenA: string
  let tokenB: string
  let userAId: string
  let userBId: string

  const ts = uniqueSuffix()
  const userA = {
    name: 'Connections E2E A',
    username: `conn_e2e_a_${ts}`,
    email: `conn_e2e_a_${ts}@example.com`,
    password: 'password123',
  }
  const userB = {
    name: 'Connections E2E B',
    username: `conn_e2e_b_${ts}`,
    email: `conn_e2e_b_${ts}@example.com`,
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
      await prisma.connection.deleteMany({})
      await prisma.user.deleteMany({ where: { email: userA.email } })
      await prisma.user.deleteMany({ where: { email: userB.email } })
    }
    await app?.close()
  })

  beforeEach(async () => {
    await prisma.connection.deleteMany({})
  })

  describe('POST /connections/follow/:id', () => {
    it('follows a user and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/connections/follow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(201)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).post(
        `/connections/follow/${userBId}`,
      )

      expect(res.status).toBe(401)
    })

    it('returns 400 when trying to follow yourself', async () => {
      const res = await request(app.getHttpServer())
        .post(`/connections/follow/${userAId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(400)
    })

    it('returns 409 when already following', async () => {
      await request(app.getHttpServer())
        .post(`/connections/follow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const res = await request(app.getHttpServer())
        .post(`/connections/follow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(409)
    })
  })

  describe('GET /connections/followers/:id', () => {
    it('returns paginated list of followers', async () => {
      await request(app.getHttpServer())
        .post(`/connections/follow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const res = await request(app.getHttpServer())
        .get(`/connections/followers/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('paginatio')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBe(1)
      expect(res.body.data[0].id).toBe(userAId)
    })

    it('returns empty list when user has no followers', async () => {
      const res = await request(app.getHttpServer())
        .get(`/connections/followers/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
      expect(res.body.paginatio.total).toBe(0)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(
        `/connections/followers/${userBId}`,
      )

      expect(res.status).toBe(401)
    })
  })

  describe('GET /connections/following/:id', () => {
    it('returns paginated list of users being followed', async () => {
      await request(app.getHttpServer())
        .post(`/connections/follow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const res = await request(app.getHttpServer())
        .get(`/connections/following/${userAId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(1)
      expect(res.body.data[0].id).toBe(userBId)
    })

    it('returns empty list when user follows nobody', async () => {
      const res = await request(app.getHttpServer())
        .get(`/connections/following/${userAId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get(
        `/connections/following/${userAId}`,
      )

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /connections/unfollow/:id', () => {
    it('unfollows a user and returns 200', async () => {
      await request(app.getHttpServer())
        .post(`/connections/follow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const res = await request(app.getHttpServer())
        .delete(`/connections/unfollow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
    })

    it('returns 200 even when not following (no-op)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/connections/unfollow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/connections/unfollow/${userBId}`,
      )

      expect(res.status).toBe(401)
    })

    it('full flow: follow → list → unfollow → confirm empty', async () => {
      await request(app.getHttpServer())
        .post(`/connections/follow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const beforeUnfollow = await request(app.getHttpServer())
        .get(`/connections/followers/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
      expect(beforeUnfollow.body.data.length).toBe(1)

      await request(app.getHttpServer())
        .delete(`/connections/unfollow/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)

      const afterUnfollow = await request(app.getHttpServer())
        .get(`/connections/followers/${userBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
      expect(afterUnfollow.body.data.length).toBe(0)
    })
  })
})
