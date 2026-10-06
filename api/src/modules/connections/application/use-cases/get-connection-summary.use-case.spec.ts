import { NotFoundException } from '@nestjs/common'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { Connection } from '../../domain/entities/connection'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'
import { GetConnectionSummaryUseCase } from './get-connection-summary.use-case'

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

describe('GetConnectionSummaryUseCase', () => {
  let useCase: GetConnectionSummaryUseCase
  let connectionRepo: jest.Mocked<ConnectionRepository>
  let userRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    connectionRepo = mockConnectionRepo()
    userRepo = mockUserRepo()
    useCase = new GetConnectionSummaryUseCase(connectionRepo, userRepo)
  })

  it('returns counts and iFollow=true when viewer follows target', async () => {
    userRepo.findById.mockResolvedValue({ id: 'target-user' } as any)
    connectionRepo.countFollowers.mockResolvedValue(5)
    connectionRepo.countFollowing.mockResolvedValue(2)
    connectionRepo.findByFollowerAndFollowing.mockResolvedValue(
      Connection.create({
        followerId: 'viewer-user',
        followingId: 'target-user',
      }),
    )

    const result = await useCase.execute({
      userId: 'target-user',
      currentUserId: 'viewer-user',
    })

    expect(result.followers).toBe(5)
    expect(result.followersCount).toBe(5)
    expect(result.following).toBe(2)
    expect(result.followeds).toBe(2)
    expect(result.followedsCount).toBe(2)
    expect(result.iFollow).toBe(true)
    expect(result.amIFollowing).toBe(true)
  })

  it('returns counts and iFollow=false when viewer does not follow target', async () => {
    userRepo.findById.mockResolvedValue({ id: 'target-user' } as any)
    connectionRepo.countFollowers.mockResolvedValue(10)
    connectionRepo.countFollowing.mockResolvedValue(0)
    connectionRepo.findByFollowerAndFollowing.mockResolvedValue(null)

    const result = await useCase.execute({
      userId: 'target-user',
      currentUserId: 'viewer-user',
    })

    expect(result.followersCount).toBe(10)
    expect(result.followingCount).toBe(0)
    expect(result.iFollow).toBe(false)
    expect(result.amIFollowing).toBe(false)
  })

  it('returns iFollow=false when target is the same as viewer', async () => {
    userRepo.findById.mockResolvedValue({ id: 'target-user' } as any)
    connectionRepo.countFollowers.mockResolvedValue(3)
    connectionRepo.countFollowing.mockResolvedValue(3)

    const result = await useCase.execute({
      userId: 'target-user',
      currentUserId: 'target-user',
    })

    expect(result.iFollow).toBe(false)
    expect(connectionRepo.findByFollowerAndFollowing).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when target user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ userId: 'nonexistent', currentUserId: 'viewer' }),
    ).rejects.toThrow(NotFoundException)
  })
})
