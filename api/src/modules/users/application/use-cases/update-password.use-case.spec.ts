import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { HashingPort } from '@shared/application/ports/hashing.port'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'
import { UpdatePasswordUseCase } from './update-password.use-case'

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

const mockHashingPort = (): jest.Mocked<HashingPort> => ({
  hash: jest.fn(),
  compare: jest.fn(),
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
      password: 'hashed_current',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('user-1'),
  )
}

describe('UpdatePasswordUseCase', () => {
  let useCase: UpdatePasswordUseCase
  let userRepo: jest.Mocked<UserRepository>
  let hashingPort: jest.Mocked<HashingPort>

  beforeEach(() => {
    userRepo = mockUserRepo()
    hashingPort = mockHashingPort()
    useCase = new UpdatePasswordUseCase(userRepo, hashingPort)
  })

  it('updates password on happy path', async () => {
    const user = makeUser()
    userRepo.findById.mockResolvedValue(user)
    hashingPort.compare.mockResolvedValue(true)
    hashingPort.hash.mockResolvedValue('hashed_new')
    userRepo.save.mockResolvedValue(undefined)

    await useCase.execute({
      id: 'user-1',
      currentPassword: 'current123',
      newPassword: 'new_password',
    })

    expect(user.password).toBe('hashed_new')
    expect(userRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        id: 'nonexistent',
        currentPassword: 'current',
        newPassword: 'new',
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws UnauthorizedException when current password is invalid', async () => {
    const user = makeUser()
    userRepo.findById.mockResolvedValue(user)
    hashingPort.compare.mockResolvedValue(false)

    await expect(
      useCase.execute({
        id: 'user-1',
        currentPassword: 'wrong_password',
        newPassword: 'new_password',
      }),
    ).rejects.toThrow(UnauthorizedException)

    expect(userRepo.save).not.toHaveBeenCalled()
  })
})
