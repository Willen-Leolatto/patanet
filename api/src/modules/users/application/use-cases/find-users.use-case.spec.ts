import { User } from '../../domain/entities/user'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { UserRepository } from '../../domain/repositories/user.repository'
import { FindUsersUseCase } from './find-users.use-case'

const mockUserRepo = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByIdWithAnimalsCount: jest.fn(),
  findByEmail: jest.fn(),
  findByGoogleId: jest.fn(),
  findByUsername: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  purge: jest.fn(),
})

function makeUser(overrides: Partial<{ name: string; username: string }> = {}) {
  return User.reconstitute(
    {
      name: overrides.name ?? 'Test User',
      displayName: null,
      about: null,
      image: null,
      imageCover: null,
      username: overrides.username ?? 'testuser',
      email: 'test@example.com',
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(),
  )
}

describe('FindUsersUseCase', () => {
  let useCase: FindUsersUseCase
  let userRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    userRepo = mockUserRepo()
    useCase = new FindUsersUseCase(userRepo)
  })

  it('returns paginated users without query', async () => {
    const users = [makeUser(), makeUser()]
    userRepo.findMany.mockResolvedValue({ items: users, total: 2 })

    const result = await useCase.execute({ page: 1, perPage: 10 })

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(userRepo.findMany).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      query: undefined,
    })
  })

  it('passes query to repository', async () => {
    userRepo.findMany.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ page: 1, perPage: 10, query: 'João' })

    expect(userRepo.findMany).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      query: 'João',
    })
  })
})
