import { ConflictException, NotFoundException } from '@nestjs/common'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'
import { UpdateUserUseCase } from './update-user.use-case'

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

function makeUser(
  overrides: Partial<{
    username: string
    email: string
    image: string | null
  }> = {},
) {
  return User.reconstitute(
    {
      name: 'Test User',
      displayName: null,
      about: null,
      image: overrides.image ?? null,
      imageCover: null,
      username: overrides.username ?? 'testuser',
      email: overrides.email ?? 'test@example.com',
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('user-1'),
  )
}

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase
  let userRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    userRepo = mockUserRepo()
    useCase = new UpdateUserUseCase(userRepo)
  })

  it('updates user on happy path', async () => {
    const user = makeUser()
    userRepo.findById.mockResolvedValue(user)
    userRepo.findByUsername.mockResolvedValue(null)
    userRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      id: 'user-1',
      name: 'New Name',
      username: 'newusername',
    })

    expect(result.name).toBe('New Name')
    expect(result.username).toBe('newusername')
    expect(userRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ id: 'nonexistent', name: 'New Name' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws ConflictException when new username is taken', async () => {
    const user = makeUser()
    const otherUser = makeUser({ username: 'takenusername' })
    userRepo.findById.mockResolvedValue(user)
    userRepo.findByUsername.mockResolvedValue(otherUser)

    await expect(
      useCase.execute({ id: 'user-1', username: 'takenusername' }),
    ).rejects.toThrow(ConflictException)

    expect(userRepo.save).not.toHaveBeenCalled()
  })

  it('updates image URL without storage side effects', async () => {
    const user = makeUser({ image: 'http://old-image.com/img.jpg' })
    userRepo.findById.mockResolvedValue(user)
    userRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      id: 'user-1',
      image: 'http://new-image.com/img.jpg',
    })

    expect(result.image).toBe('http://new-image.com/img.jpg')
    expect(userRepo.save).toHaveBeenCalledTimes(1)
  })
})
