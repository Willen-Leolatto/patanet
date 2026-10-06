import { Connection } from '../../domain/entities/connection'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'
import { UnfollowUseCase } from './unfollow.use-case'

const mockConnectionRepo = (): jest.Mocked<ConnectionRepository> => ({
  findByFollowerAndFollowing: jest.fn(),
  findFollowers: jest.fn(),
  findFollowing: jest.fn(),
  countFollowers: jest.fn(),
  countFollowing: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('UnfollowUseCase', () => {
  let useCase: UnfollowUseCase
  let connectionRepo: jest.Mocked<ConnectionRepository>

  beforeEach(() => {
    connectionRepo = mockConnectionRepo()
    useCase = new UnfollowUseCase(connectionRepo)
  })

  it('deletes the connection on happy path', async () => {
    const connection = Connection.create({
      followerId: 'user-1',
      followingId: 'user-2',
    })
    connectionRepo.findByFollowerAndFollowing.mockResolvedValue(connection)
    connectionRepo.delete.mockResolvedValue()

    await useCase.execute({ followerId: 'user-1', followingId: 'user-2' })

    expect(connectionRepo.delete).toHaveBeenCalledWith(connection.id.toValue())
  })

  it('does nothing when not following (no-op)', async () => {
    connectionRepo.findByFollowerAndFollowing.mockResolvedValue(null)

    await expect(
      useCase.execute({ followerId: 'user-1', followingId: 'user-2' }),
    ).resolves.toBeUndefined()

    expect(connectionRepo.delete).not.toHaveBeenCalled()
  })
})
