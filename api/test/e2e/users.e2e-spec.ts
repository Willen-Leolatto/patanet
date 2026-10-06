import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp } from './helpers/app.helper'
import { PrismaService } from '../../src/database/prisma/prisma.service'
import { uniqueSuffix } from './helpers/unique.helper'
import { acceptTerms } from './helpers/auth.helper'

describe('/users (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let accessToken: string
  let userId: string

  const ts = uniqueSuffix()
  const testUser = {
    name: 'E2E Test User',
    username: `e2e_user_${ts}`,
    email: `e2e_${ts}@example.com`,
    password: 'password123',
  }

  beforeAll(async () => {
    app = await createApp()
    prisma = app.get(PrismaService)
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } })
    await app.close()
  })

  describe('POST /users', () => {
    it('creates a user and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .field('name', testUser.name)
        .field('username', testUser.username)
        .field('email', testUser.email)
        .field('password', testUser.password)

      expect(res.status).toBe(201)
    })

    it('returns 409 when email already exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .field('name', testUser.name)
        .field('username', `other_${uniqueSuffix()}`)
        .field('email', testUser.email)
        .field('password', testUser.password)

      expect(res.status).toBe(409)
    })

    it('returns 409 when username already exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .field('name', testUser.name)
        .field('username', testUser.username)
        .field('email', `other_${uniqueSuffix()}@example.com`)
        .field('password', testUser.password)

      expect(res.status).toBe(409)
    })
  })

  describe('POST /auth/session (to get token)', () => {
    it('logs in and returns tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/session')
        .send({ username: testUser.username, password: testUser.password })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('access_token')
      accessToken = res.body.access_token
      await acceptTerms(app, accessToken)
    })
  })

  describe('GET /users (authenticated)', () => {
    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/users')
      expect(res.status).toBe(401)
    })

    it('returns paginated users with token', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('paginatio')
    })
  })

  describe('GET /users/me', () => {
    it('returns current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.email).toBe(testUser.email)
      userId = res.body.id
    })
  })

  describe('GET /users/:id', () => {
    it('returns user by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(userId)
    })

    it('returns 404 for nonexistent user', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/nonexistent-id-12345')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /users', () => {
    it('updates user profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('name', 'Updated Name')

      expect(res.status).toBe(200)
    })
  })

  describe('PATCH /users/password', () => {
    it('updates password', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        })

      expect(res.status).toBe(200)
    })

    it('returns 401 with wrong current password', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'another123',
        })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /users', () => {
    it('deletes own account', async () => {
      const res = await request(app.getHttpServer())
        .delete('/users')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
    })
  })
})
