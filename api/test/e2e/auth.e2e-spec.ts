import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp } from './helpers/app.helper'
import { PrismaService } from '../../src/database/prisma/prisma.service'
import { uniqueSuffix } from './helpers/unique.helper'

describe('/auth (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  const ts = uniqueSuffix()
  const testUser = {
    name: 'Auth E2E User',
    username: `auth_e2e_${ts}`,
    email: `auth_e2e_${ts}@example.com`,
    password: 'password123',
  }

  beforeAll(async () => {
    app = await createApp()
    prisma = app.get(PrismaService)

    await request(app.getHttpServer())
      .post('/users')
      .field('name', testUser.name)
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } })
    await app.close()
  })

  describe('POST /auth/session', () => {
    it('returns access_token and refresh_token on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/session')
        .send({ username: testUser.username, password: testUser.password })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('access_token')
      expect(res.body).toHaveProperty('refresh_token')
      expect(typeof res.body.access_token).toBe('string')
      expect(typeof res.body.refresh_token).toBe('string')
    })

    it('also accepts email as username field', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/session')
        .send({ username: testUser.email, password: testUser.password })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('access_token')
    })

    it('returns 401 on wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/session')
        .send({ username: testUser.username, password: 'wrongpassword' })

      expect(res.status).toBe(401)
    })

    it('returns 401 for nonexistent user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/session')
        .send({ username: 'nobody_xyz_123', password: 'pass' })

      expect(res.status).toBe(401)
    })

    it('returns 400 when body is missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/session')
        .send({})

      expect(res.status).toBe(400)
    })
  })

  describe('POST /auth/refresh', () => {
    let refreshToken: string
    let accessToken: string

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/session')
        .send({ username: testUser.username, password: testUser.password })

      accessToken = res.body.access_token
      refreshToken = res.body.refresh_token
    })

    it('returns new token pair with valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('refresh-token', refreshToken)

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('access_token')
      expect(res.body).toHaveProperty('refresh_token')
    })

    it('new access token works for authenticated endpoints', async () => {
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('refresh-token', refreshToken)

      const newAccessToken = refreshRes.body.access_token

      const meRes = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${newAccessToken}`)

      expect(meRes.status).toBe(200)
      expect(meRes.body.email).toBe(testUser.email)
    })

    it('returns 401 with no refresh-token header', async () => {
      const res = await request(app.getHttpServer()).post('/auth/refresh')

      expect(res.status).toBe(401)
    })

    it('returns 401 with invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('refresh-token', 'invalid.token.value')

      expect(res.status).toBe(401)
    })

    it('full flow: signup → login → use token → refresh → use new token', async () => {
      const flowTs = uniqueSuffix()
      const flowUser = {
        name: 'Flow User',
        username: `flow_${flowTs}`,
        email: `flow_${flowTs}@example.com`,
        password: 'flowpass123',
      }

      await request(app.getHttpServer())
        .post('/users')
        .field('name', flowUser.name)
        .field('username', flowUser.username)
        .field('email', flowUser.email)
        .field('password', flowUser.password)

      const loginRes = await request(app.getHttpServer())
        .post('/auth/session')
        .send({ username: flowUser.username, password: flowUser.password })

      expect(loginRes.status).toBe(201)
      const { access_token, refresh_token } = loginRes.body

      const meRes1 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${access_token}`)
      expect(meRes1.status).toBe(200)

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('refresh-token', refresh_token)
      expect(refreshRes.status).toBe(201)
      const newAccessToken = refreshRes.body.access_token

      const meRes2 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
      expect(meRes2.status).toBe(200)
      expect(meRes2.body.email).toBe(flowUser.email)

      await prisma.user.deleteMany({ where: { email: flowUser.email } })
    })
  })
})
