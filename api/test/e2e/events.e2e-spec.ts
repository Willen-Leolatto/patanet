import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp } from './helpers/app.helper'
import { PrismaService } from '../../src/database/prisma/prisma.service'
import { uniqueSuffix } from './helpers/unique.helper'
import { acceptTerms } from './helpers/auth.helper'

describe('/events (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let accessToken: string
  let eventId: string

  const ts = uniqueSuffix()
  const testUser = {
    name: 'Events E2E User',
    username: `events_e2e_${ts}`,
    email: `events_e2e_${ts}@example.com`,
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

    const loginRes = await request(app.getHttpServer())
      .post('/auth/session')
      .send({ username: testUser.username, password: testUser.password })

    accessToken = loginRes.body.access_token
    await acceptTerms(app, accessToken)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.event.deleteMany({})
      await prisma.post.deleteMany({ where: { author: { email: testUser.email } } })
      await prisma.user.deleteMany({ where: { email: testUser.email } })
    }
    await app?.close()
  })

  describe('GET /events', () => {
    it('returns paginated events without authentication', async () => {
      const res = await request(app.getHttpServer()).get('/events')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('supports pagination params', async () => {
      const res = await request(app.getHttpServer()).get(
        '/events?page=1&perPage=10',
      )

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('paginatio')
    })
  })

  describe('POST /events', () => {
    it('creates an event and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Evento E2E')
        .field('description', 'Descrição do evento de teste')

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.title).toBe('Evento E2E')
      expect(res.body).toHaveProperty('postId')

      eventId = res.body.id
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .field('title', 'Unauthorized Event')

      expect(res.status).toBe(401)
    })

    it('returns 400 when title is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', '')

      expect(res.status).toBe(400)
    })
  })

  describe('GET /events/:id', () => {
    it('returns the event by id', async () => {
      const res = await request(app.getHttpServer()).get(`/events/${eventId}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(eventId)
    })

    it('returns 404 for non-existent event', async () => {
      const res = await request(app.getHttpServer()).get(
        '/events/nonexistent-id',
      )

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /events/:id', () => {
    it('updates an event', async () => {
      const res = await request(app.getHttpServer())
        .put(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Evento E2E Atualizado')

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Evento E2E Atualizado')
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .put(`/events/${eventId}`)
        .field('title', 'Should Fail')

      expect(res.status).toBe(401)
    })

    it('returns 404 when event not found or not owner', async () => {
      const res = await request(app.getHttpServer())
        .put('/events/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'X')

      expect(res.status).toBe(404)
    })
  })

  describe('POST /events/:id/repost', () => {
    it('reposts an event returning 200', async () => {
      const res = await request(app.getHttpServer())
        .post(`/events/${eventId}/repost`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(eventId)
      expect(res.body).toHaveProperty('postId')
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).post(
        `/events/${eventId}/repost`,
      )

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /events/:id', () => {
    it('deletes an event', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Evento para deletar')

      const idToDelete = createRes.body.id

      const res = await request(app.getHttpServer())
        .delete(`/events/${idToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/events/${eventId}`,
      )

      expect(res.status).toBe(401)
    })
  })
})
