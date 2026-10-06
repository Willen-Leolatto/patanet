import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp } from './helpers/app.helper'
import { PrismaService } from '../../src/database/prisma/prisma.service'
import { uniqueSuffix } from './helpers/unique.helper'
import { acceptTerms } from './helpers/auth.helper'
import {
  ReportStatus,
  ReportType,
  ReportCategory,
} from '../../src/modules/reports/domain/entities/report'

describe('/reports (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let tokenUser: string
  let tokenAdmin: string
  let userId: string

  const ts = uniqueSuffix()
  const regularUser = {
    name: 'Reports E2E User',
    username: `reports_e2e_user_${ts}`,
    email: `reports_e2e_user_${ts}@example.com`,
    password: 'password123',
  }
  const adminUser = {
    name: 'Reports E2E Admin',
    username: `reports_e2e_admin_${ts}`,
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
      await prisma.report.deleteMany({})
      await prisma.user.deleteMany({ where: { email: regularUser.email } })
      await prisma.user.deleteMany({ where: { email: adminUser.email } })
    }
    await app?.close()
  })

  beforeEach(async () => {
    await prisma.report.deleteMany({})
  })

  describe('POST /reports', () => {
    it('creates a report and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          type: ReportType.USER,
          category: ReportCategory.GENERAL,
          targetId: userId,
          message: 'This user is behaving badly',
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.reporterId).toBe(userId)
      expect(res.body.type).toBe(ReportType.USER)
      expect(res.body.category).toBe(ReportCategory.GENERAL)
      expect(res.body.status).toBe(ReportStatus.OPEN)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).post('/reports').send({
        type: ReportType.USER,
        category: ReportCategory.GENERAL,
        targetId: userId,
        message: 'Some message',
      })

      expect(res.status).toBe(401)
    })

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ message: 'Missing type and category' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /reports/mine', () => {
    it('returns only the authenticated user reports', async () => {
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          type: ReportType.USER,
          category: ReportCategory.GENERAL,
          targetId: 'some-target',
          message: 'First report',
        })

      const res = await request(app.getHttpServer())
        .get('/reports/mine')
        .set('Authorization', `Bearer ${tokenUser}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('paginatio')
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].reporterId).toBe(userId)
      expect(res.body.paginatio.total).toBe(1)
    })

    it('admin reports do not appear in regular user mine list', async () => {
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          type: ReportType.USER,
          category: ReportCategory.GENERAL,
          targetId: 'some-target',
          message: 'Admin report',
        })

      const res = await request(app.getHttpServer())
        .get('/reports/mine')
        .set('Authorization', `Bearer ${tokenUser}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/reports/mine')

      expect(res.status).toBe(401)
    })
  })

  describe('PATCH /reports/:id/status', () => {
    it('admin can update report status', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          type: ReportType.USER,
          category: ReportCategory.GENERAL,
          targetId: 'some-target',
          message: 'Report to update',
        })

      const reportId = createRes.body.id

      const res = await request(app.getHttpServer())
        .patch(`/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: ReportStatus.RESOLVED })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe(ReportStatus.RESOLVED)
    })

    it('regular user gets 403 when trying to update status', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          type: ReportType.USER,
          category: ReportCategory.GENERAL,
          targetId: 'some-target',
          message: 'Report for access test',
        })

      const reportId = createRes.body.id

      const res = await request(app.getHttpServer())
        .patch(`/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ status: ReportStatus.RESOLVED })

      expect(res.status).toBe(403)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .patch('/reports/some-id/status')
        .send({ status: ReportStatus.RESOLVED })

      expect(res.status).toBe(401)
    })

    it('returns 404 when report does not exist', async () => {
      const res = await request(app.getHttpServer())
        .patch('/reports/nonexistent-id/status')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: ReportStatus.RESOLVED })

      expect(res.status).toBe(404)
    })

    it('full flow: create → list mine → admin updates status', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          type: ReportType.POST,
          category: ReportCategory.CSAE,
          targetId: 'post-target-1',
          message: 'Inappropriate post',
        })
      expect(createRes.status).toBe(201)
      const reportId = createRes.body.id

      const mineRes = await request(app.getHttpServer())
        .get('/reports/mine')
        .set('Authorization', `Bearer ${tokenUser}`)
      expect(mineRes.body.data[0].id).toBe(reportId)
      expect(mineRes.body.data[0].status).toBe(ReportStatus.OPEN)

      const updateRes = await request(app.getHttpServer())
        .patch(`/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: ReportStatus.IN_REVIEW })
      expect(updateRes.status).toBe(200)
      expect(updateRes.body.status).toBe(ReportStatus.IN_REVIEW)
    })
  })
})
