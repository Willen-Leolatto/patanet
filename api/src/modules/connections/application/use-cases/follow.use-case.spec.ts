import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { Connection } from '../../domain/entities/connection'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'
import { FollowUseCase } from './follow.use-case'

const mockConnectionRepo = (): jest.Mocked<ConnectionRepository> => ({
  findByFollowerAndFollowing: jest.fn(),
  findFollowers: jest.fn(),
  findFollowing: jest.fn(),
  countFollowers: jest.fn(),
  countFollowing: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

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

describe('FollowUseCase', () => {
  let useCase: FollowUseCase
  let connectionRepo: jest.Mocked<ConnectionRepository>
  let userRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    connectionRepo = mockConnectionRepo()
    userRepo = mockUserRepo()
    useCase = new FollowUseCase(connectionRepo, userRepo)
  })

  it('creates a connection on happy path', async () => {
    userRepo.findById.mockResolvedValue({ id: 'user-2' } as any)
    connectionRepo.findByFollowerAndFollowing.mockResolvedValue(null)
    connectionRepo.save.mockResolvedValue()

    await useCase.execute({ followerId: 'user-1', followingId: 'user-2' })

    expect(connectionRepo.save).toHaveBeenCalledTimes(1)
    const saved = connectionRepo.save.mock.calls[0][0]
    expect(saved.followerId).toBe('user-1')
    expect(saved.followingId).toBe('user-2')
  })

  it('throws BadRequestException when trying to follow yourself', async () => {
    await expect(
      useCase.execute({ followerId: 'user-1', followingId: 'user-1' }),
    ).rejects.toThrow(BadRequestException)

    expect(connectionRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when target user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ followerId: 'user-1', followingId: 'nonexistent' }),
    ).rejects.toThrow(NotFoundException)

    expect(connectionRepo.save).not.toHaveBeenCalled()
  })

  it('throws ConflictException when already following', async () => {
    userRepo.findById.mockResolvedValue({ id: 'user-2' } as any)
    const existing = Connection.create({
      followerId: 'user-1',
      followingId: 'user-2',
    })
    connectionRepo.findByFollowerAndFollowing.mockResolvedValue(existing)

    await expect(
      useCase.execute({ followerId: 'user-1', followingId: 'user-2' }),
    ).rejects.toThrow(ConflictException)

    expect(connectionRepo.save).not.toHaveBeenCalled()
  })
})
