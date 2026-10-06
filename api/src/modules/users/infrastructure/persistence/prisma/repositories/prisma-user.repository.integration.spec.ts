import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { User } from '../../../../domain/entities/user'
import { UserRepository } from '../../../../domain/repositories/user.repository'
import { PrismaUserRepository } from './prisma-user.repository'

describe('PrismaUserRepository (integration)', () => {
  let module: TestingModule
  let repository: UserRepository
  let prisma: PrismaService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: UserRepository, useClass: PrismaUserRepository },
      ],
    }).compile()

    repository = module.get(UserRepository)
    prisma = module.get(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany({})
  })

  function makeUserData(
    overrides: Partial<{ username: string; email: string }> = {},
  ) {
    return {
      name: 'Test User',
      username: overrides.username ?? `user_${Date.now()}`,
      email: overrides.email ?? `test_${Date.now()}@example.com`,
      password: 'hashed_password',
      image: null,
      displayName: null,
      about: null,
      imageCover: null,
    }
  }

  it('saves and finds user by id', async () => {
    const user = User.create(makeUserData())
    await repository.save(user)

    const found = await repository.findById(user.id.toValue())
    expect(found).not.toBeNull()
    if (!found) throw new Error('User not found')
    expect(found.name).toBe('Test User')
    expect(found.id.toValue()).toBe(user.id.toValue())
  })

  it('finds user by email', async () => {
    const data = makeUserData({ email: 'findbyemail@example.com' })
    const user = User.create(data)
    await repository.save(user)

    const found = await repository.findByEmail('findbyemail@example.com')
    expect(found).not.toBeNull()
    if (!found) throw new Error('User not found')
    expect(found.email).toBe('findbyemail@example.com')
  })

  it('finds user by username', async () => {
    const data = makeUserData({ username: 'findbyusername' })
    const user = User.create(data)
    await repository.save(user)

    const found = await repository.findByUsername('findbyusername')
    expect(found).not.toBeNull()
    if (!found) throw new Error('User not found')
    expect(found.username).toBe('findbyusername')
  })

  it('returns null when user not found by id', async () => {
    const found = await repository.findById('nonexistent-id')
    expect(found).toBeNull()
  })

  it('findMany returns paginated results', async () => {
    const u1 = User.create(
      makeUserData({ username: 'alpha_user', email: 'alpha@example.com' }),
    )
    const u2 = User.create(
      makeUserData({ username: 'beta_user', email: 'beta@example.com' }),
    )
    await repository.save(u1)
    await repository.save(u2)

    const result = await repository.findMany({ page: 1, perPage: 10 })
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.items.length).toBeGreaterThanOrEqual(2)
  })

  it('findMany filters by query', async () => {
    const data = makeUserData({
      username: 'querysearch_user',
      email: 'querysearch@example.com',
    })
    data.name = 'QuerySearchName'
    const user = User.create(data)
    await repository.save(user)

    const result = await repository.findMany({
      page: 1,
      perPage: 10,
      query: 'QuerySearchName',
    })
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.items.some(u => u.name === 'QuerySearchName')).toBe(true)
  })

  it('deletes user', async () => {
    const user = User.create(makeUserData())
    await repository.save(user)

    await repository.delete(user.id.toValue())

    const found = await repository.findById(user.id.toValue())
    expect(found).toBeNull()
  })
})
