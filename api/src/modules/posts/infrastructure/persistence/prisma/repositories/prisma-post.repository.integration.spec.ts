import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Post } from '@modules/posts/domain/entities/post'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { PrismaPostRepository } from './prisma-post.repository'

describe('PrismaPostRepository (integration)', () => {
  let module: TestingModule
  let repository: PostRepository
  let prisma: PrismaService
  let testUserId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: PostRepository, useClass: PrismaPostRepository },
      ],
    }).compile()

    repository = module.get(PostRepository)
    prisma = module.get(PrismaService)

    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: 'Integration User',
        username: `intuser_${Date.now()}`,
        email: `int_${Date.now()}@example.com`,
        password: 'hashed',
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    await prisma.media.deleteMany({})
    await prisma.like.deleteMany({})
    await prisma.comment.deleteMany({})
    await prisma.post.deleteMany({})
    await prisma.user.deleteMany({ where: { id: testUserId } })
    await module.close()
  })

  beforeEach(async () => {
    await prisma.media.deleteMany({})
    await prisma.like.deleteMany({})
    await prisma.comment.deleteMany({})
    await prisma.post.deleteMany({})
  })

  function makePost(subtitle = 'Test post'): Post {
    return Post.create({
      subtitle,
      authorId: testUserId,
      petIds: [],
    })
  }

  it('saves and finds a post by id', async () => {
    const post = makePost()
    await repository.save(post)

    const found = await repository.findById(post.id.toValue())
    expect(found).not.toBeNull()
    if (!found) throw new Error('Post not found')
    expect(found.subtitle).toBe('Test post')
    expect(found.id.toValue()).toBe(post.id.toValue())
  })

  it('returns null when post not found by id', async () => {
    const found = await repository.findById('nonexistent-id')
    expect(found).toBeNull()
  })

  it('findByUserId returns posts for a specific user', async () => {
    const p1 = makePost('Post 1')
    const p2 = makePost('Post 2')
    await repository.save(p1)
    await repository.save(p2)

    const { items, total } = await repository.findByUserId(testUserId, {
      page: 1,
      perPage: 10,
    })
    expect(total).toBeGreaterThanOrEqual(2)
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(items.every(p => p.authorId === testUserId)).toBe(true)
  })

  it('findFeed includes own posts when followedIds is empty', async () => {
    const post = makePost('Feed post')
    await repository.save(post)

    const { items, total } = await repository.findFeed(testUserId, [], {
      page: 1,
      perPage: 10,
    })
    expect(total).toBeGreaterThanOrEqual(1)
    expect(items.some(p => p.id.toValue() === post.id.toValue())).toBe(true)
  })

  it('deletes a post', async () => {
    const post = makePost()
    await repository.save(post)

    await repository.delete(post.id.toValue())

    const found = await repository.findById(post.id.toValue())
    expect(found).toBeNull()
  })

  it('findByUserId supports pagination', async () => {
    for (let i = 0; i < 3; i++) {
      await repository.save(makePost(`Paged post ${i}`))
    }

    const page1 = await repository.findByUserId(testUserId, {
      page: 1,
      perPage: 2,
    })
    expect(page1.items.length).toBeLessThanOrEqual(2)
    expect(page1.total).toBeGreaterThanOrEqual(3)
  })
})
