import { NotFoundException } from '@nestjs/common'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'
import { FindUserByIdUseCase } from './find-user-by-id.use-case'

const mockUserRepo = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByIdWithAnimalsCount: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByGoogleId: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  purge: jest.fn(),
})

function makeUser() {
  return User.reconstitute(
    {
      name: 'Test User',
      displayName: null,
      about: null,
      image: null,
      imageCover: null,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('user-1'),
  )
}

describe('FindUserByIdUseCase', () => {
  let useCase: FindUserByIdUseCase
  let userRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    userRepo = mockUserRepo()
    useCase = new FindUserByIdUseCase(userRepo)
  })

  it('returns user on happy path', async () => {
    const user = makeUser()
    userRepo.findByIdWithAnimalsCount.mockResolvedValue(user)

    const result = await useCase.execute({ id: 'user-1' })

    expect(result.id.toValue()).toBe('user-1')
    expect(result.email).toBe('test@example.com')
  })

  it('throws NotFoundException when user does not exist', async () => {
    userRepo.findByIdWithAnimalsCount.mockResolvedValue(null)

    await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(
      NotFoundException,
    )
  })
})
