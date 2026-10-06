import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createApp } from './helpers/app.helper'
import { PrismaService } from '../../src/database/prisma/prisma.service'
import { uniqueSuffix } from './helpers/unique.helper'
import { acceptTerms } from './helpers/auth.helper'

describe('/posts (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let accessToken: string
  let postId: string
  let commentId: string

  const ts = uniqueSuffix()
  const testUser = {
    name: 'Posts E2E User',
    username: `posts_e2e_${ts}`,
    email: `posts_e2e_${ts}@example.com`,
    password: 'password123',
  }

  beforeAll(async () => {
    app = await createApp()
    prisma = app.get(PrismaService)

    // Create user
    await request(app.getHttpServer())
      .post('/users')
      .field('name', testUser.name)
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/session')
      .send({ username: testUser.username, password: testUser.password })

    accessToken = loginRes.body.access_token
    await acceptTerms(app, accessToken)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.like.deleteMany({ where: { post: { author: { email: testUser.email } } } })
      await prisma.comment.deleteMany({ where: { post: { author: { email: testUser.email } } } })
      await prisma.media.deleteMany({ where: { post: { author: { email: testUser.email } } } })
      await prisma.post.deleteMany({ where: { author: { email: testUser.email } } })
      await prisma.user.deleteMany({ where: { email: testUser.email } })
    }
    await app?.close()
  })

  describe('POST /posts', () => {
    it('creates a post and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('subtitle', 'My first post')

      expect(res.status).toBe(201)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .field('subtitle', 'Unauthorized post')

      expect(res.status).toBe(401)
    })
  })

  describe('GET /posts/feed', () => {
    it('returns paginated feed for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/posts/feed')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('paginatio')
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/posts/feed')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /posts/me', () => {
    it('returns own posts', async () => {
      // Create a post first
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('subtitle', 'My feed post')

      const res = await request(app.getHttpServer())
        .get('/posts/me')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)

      postId = res.body.data[0].id
    })
  })

  describe('PATCH /posts/:id', () => {
    it('updates a post', async () => {
      if (!postId) {
        const createRes = await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('subtitle', 'Post to update')
        expect(createRes.status).toBe(201)

        const meRes = await request(app.getHttpServer())
          .get('/posts/me')
          .set('Authorization', `Bearer ${accessToken}`)
        postId = meRes.body.data[0].id
      }

      const res = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field('subtitle', 'Updated subtitle')

      expect(res.status).toBe(200)
    })
  })

  describe('POST /posts/like/:id', () => {
    it('likes a post', async () => {
      const res = await request(app.getHttpServer())
        .post(`/posts/like/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(201)
    })

    it('unlikes a post when already liked', async () => {
      const res = await request(app.getHttpServer())
        .post(`/posts/like/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(201)
    })

    it('returns 404 when post not found', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts/like/nonexistent-post-id')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('POST /posts/comment/:id', () => {
    it('creates a comment on a post', async () => {
      const res = await request(app.getHttpServer())
        .post(`/posts/comment/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'A test comment' })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.message).toBe('A test comment')
      commentId = res.body.id
    })

    it('creates a reply to a comment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/posts/comment/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'A reply', parentId: commentId })

      expect(res.status).toBe(201)
      expect(res.body.message).toBe('A reply')
    })

    it('returns 404 when parent comment not found', async () => {
      const res = await request(app.getHttpServer())
        .post(`/posts/comment/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Reply', parentId: 'nonexistent-parent' })

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /posts/:postId/comment/:commentId', () => {
    it('updates a comment', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/posts/${postId}/comment/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Updated comment message' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Updated comment message')
    })

    it('returns 404 when comment not found', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/posts/${postId}/comment/nonexistent-comment`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Should not work' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /posts/:postId/comment/:commentId', () => {
    it('deletes a comment', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/posts/${postId}/comment/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)
    })
  })

  describe('DELETE /posts/:id', () => {
    it('deletes a post', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
    })

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer()).delete(`/posts/${postId}`)
      expect(res.status).toBe(401)
    })
  })
})
