import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp } from './helpers/app.helper'
import { PrismaService } from '../../src/database/prisma/prisma.service'
import { uniqueSuffix } from './helpers/unique.helper'
import { acceptTerms } from './helpers/auth.helper'
import {
  TicketCategory,
  TicketStatus,
} from '../../src/modules/support/domain/entities/support-ticket'

describe('/support (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let tokenUser: string
  let tokenAdmin: string
  let userId: string

  const ts = uniqueSuffix()
  const regularUser = {
    name: 'Support E2E User',
    username: `support_e2e_user_${ts}`,
    email: `support_e2e_user_${ts}@example.com`,
    password: 'password123',
  }
  const adminUser = {
    name: 'Support E2E Admin',
    username: `support_e2e_admin_${ts}`,
    email: `admin_${ts}@test.com`,
    password: 'password123',
  }

  beforeAll(async () => {
    process.env.ADMIN_EMAILS = adminUser.email
    app = await createApp()
    prisma = app.get(PrismaService)

    await request(app.getHttpServer())
      .post('/users')
      .field('name', regularUser.name)
      .field('username', regularUser.username)
      .field('email', regularUser.email)
      .field('password', regularUser.password)

    await request(app.getHttpServer())
      .post('/users')
      .field('name', adminUser.name)
      .field('username', adminUser.username)
      .field('email', adminUser.email)
      .field('password', adminUser.password)

    const loginUser = await request(app.getHttpServer())
      .post('/auth/session')
      .send({ username: regularUser.username, password: regularUser.password })
    tokenUser = loginUser.body.access_token

    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/session')
      .send({ username: adminUser.username, password: adminUser.password })
    tokenAdmin = loginAdmin.body.access_token
    await acceptTerms(app, tokenUser)
    await acceptTerms(app, tokenAdmin)

    const meRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${tokenUser}`)
    userId = meRes.body.id
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.supportTicketMessage.deleteMany({})
      await prisma.supportTicket.deleteMany({})
      await prisma.user.deleteMany({ where: { email: regularUser.email } })
      await prisma.user.deleteMany({ where: { email: adminUser.email } })
    }
    await app?.close()
  })

  beforeEach(async () => {
    await prisma.supportTicketMessage.deleteMany({})
    await prisma.supportTicket.deleteMany({})
  })

  describe('POST /support', () => {
    it('creates a ticket and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          category: TicketCategory.GENERAL,
          subject: 'Help with account',
          message: 'I need assistance',
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.authorId).toBe(userId)
      expect(res.body.category).toBe(TicketCategory.GENERAL)
      expect(res.body.status).toBe(TicketStatus.OPEN)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).post('/support').send({
        category: TicketCategory.GENERAL,
        subject: 'Test',
        message: 'Hello',
      })

      expect(res.status).toBe(401)
    })

    it('returns 400 when subject exceeds 120 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          category: TicketCategory.GENERAL,
          subject: 'A'.repeat(121),
          message: 'Some message',
        })

      expect(res.status).toBe(400)
    })

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ subject: 'Missing category and message' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /support/mine', () => {
    it('returns only authenticated user tickets', async () => {
      await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          category: TicketCategory.GENERAL,
          subject: 'My ticket',
          message: 'Content',
        })

      const res = await request(app.getHttpServer())
        .get('/support/mine')
        .set('Authorization', `Bearer ${tokenUser}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].authorId).toBe(userId)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/support/mine')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /support/all', () => {
    it('admin can list all tickets', async () => {
      await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          category: TicketCategory.GENERAL,
          subject: 'Ticket 1',
          message: 'Content',
        })

      const res = await request(app.getHttpServer())
        .get('/support/all')
        .set('Authorization', `Bearer ${tokenAdmin}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it('regular user gets 403 when accessing /support/all', async () => {
      const res = await request(app.getHttpServer())
        .get('/support/all')
        .set('Authorization', `Bearer ${tokenUser}`)

      expect(res.status).toBe(403)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/support/all')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /support/:id/messages', () => {
    it('sends a message to an existing ticket', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          category: TicketCategory.GENERAL,
          subject: 'Ticket',
          message: 'Initial',
        })

      const ticketId = createRes.body.id

      const res = await request(app.getHttpServer())
        .post(`/support/${ticketId}/messages`)
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ message: 'Follow up question' })

      expect(res.status).toBe(201)
    })

    it('returns 404 for nonexistent ticket', async () => {
      const res = await request(app.getHttpServer())
        .post('/support/nonexistent-id/messages')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ message: 'Hello' })

      expect(res.status).toBe(404)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/support/some-id/messages')
        .send({ message: 'Hello' })

      expect(res.status).toBe(401)
    })
  })

  describe('PATCH /support/:id/status', () => {
    it('admin can update ticket status', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          category: TicketCategory.GENERAL,
          subject: 'Status test',
          message: 'Content',
        })

      const ticketId = createRes.body.id

      const res = await request(app.getHttpServer())
        .patch(`/support/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: TicketStatus.IN_REVIEW })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe(TicketStatus.IN_REVIEW)
    })

    it('regular user gets 403 when updating status', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          category: TicketCategory.GENERAL,
          subject: 'Forbidden test',
          message: 'Content',
        })

      const ticketId = createRes.body.id

      const res = await request(app.getHttpServer())
        .patch(`/support/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ status: TicketStatus.RESOLVED })

      expect(res.status).toBe(403)
    })

    it('returns 404 when ticket does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch('/support/nonexistent-id/status')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: TicketStatus.RESOLVED })

      expect(res.status).toBe(404)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .patch('/support/some-id/status')
        .send({ status: TicketStatus.RESOLVED })

      expect(res.status).toBe(401)
    })
  })

  describe('Full flow', () => {
    it('open ticket → send message → admin updates status', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/support')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          category: TicketCategory.ACCOUNT_DELETION,
          subject: 'Please delete my account',
          message: 'I want to delete my account permanently',
        })
      expect(createRes.status).toBe(201)
      const ticketId = createRes.body.id

      const mineRes = await request(app.getHttpServer())
        .get('/support/mine')
        .set('Authorization', `Bearer ${tokenUser}`)
      expect(mineRes.body.data[0].id).toBe(ticketId)
      expect(mineRes.body.data[0].status).toBe(TicketStatus.OPEN)

      const msgRes = await request(app.getHttpServer())
        .post(`/support/${ticketId}/messages`)
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ message: 'Please confirm when done' })
      expect(msgRes.status).toBe(201)

      const updateRes = await request(app.getHttpServer())
        .patch(`/support/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: TicketStatus.IN_REVIEW })
      expect(updateRes.status).toBe(200)
      expect(updateRes.body.status).toBe(TicketStatus.IN_REVIEW)

      const resolveRes = await request(app.getHttpServer())
        .patch(`/support/${ticketId}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: TicketStatus.RESOLVED })
      expect(resolveRes.status).toBe(200)
      expect(resolveRes.body.status).toBe(TicketStatus.RESOLVED)
    })
  })
})
