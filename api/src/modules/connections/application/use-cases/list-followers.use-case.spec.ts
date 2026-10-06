import { User } from '@modules/users/domain/entities/user'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'
import { ListFollowersUseCase } from './list-followers.use-case'

const mockConnectionRepo = (): jest.Mocked<ConnectionRepository> => ({
  findByFollowerAndFollowing: jest.fn(),
  findFollowers: jest.fn(),
  findFollowing: jest.fn(),
  countFollowers: jest.fn(),
  countFollowing: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

function makeUser(id: string, username: string): User {
  return User.reconstitute(
    {
      name: 'Test User',
      displayName: null,
      about: null,
      image: null,
      imageCover: null,
      username,
      email: `${username}@example.com`,
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('ListFollowersUseCase', () => {
  let useCase: ListFollowersUseCase
  let connectionRepo: jest.Mocked<ConnectionRepository>

  beforeEach(() => {
    connectionRepo = mockConnectionRepo()
    useCase = new ListFollowersUseCase(connectionRepo)
  })

  it('returns paginated list of followers', async () => {
    const followers = [makeUser('u1', 'user1'), makeUser('u2', 'user2')]
    connectionRepo.findFollowers.mockResolvedValue({
      items: followers,
      total: 2,
    })

    const result = await useCase.execute({
      userId: 'target',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(connectionRepo.findFollowers).toHaveBeenCalledWith('target', {
      page: 1,
      perPage: 10,
    })
  })

  it('returns empty list when user has no followers', async () => {
    connectionRepo.findFollowers.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({
      userId: 'target',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('passes correct pagination to repository', async () => {
    connectionRepo.findFollowers.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ userId: 'target', page: 3, perPage: 5 })

    expect(connectionRepo.findFollowers).toHaveBeenCalledWith('target', {
      page: 3,
      perPage: 5,
    })
  })
})
