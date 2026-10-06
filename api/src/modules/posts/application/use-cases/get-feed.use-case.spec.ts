import { PostRepository } from '../../domain/repositories/post.repository'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'
import { BlockRepository } from '../../domain/repositories/block.repository'
import { GetFeedUseCase } from './get-feed.use-case'
import { Post } from '../../domain/entities/post'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockPostRepo = (): jest.Mocked<PostRepository> => ({
  findById: jest.fn(),
  findFeed: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockConnectionRepo = (): jest.Mocked<ConnectionRepository> => ({
  findFollowedIdsByUserId: jest.fn(),
})

const mockBlockRepo = (): jest.Mocked<BlockRepository> => ({
  findBlockedUserIds: jest.fn(),
})

function makePost(authorId: string): Post {
  return Post.reconstitute(
    {
      subtitle: 'Test',
      authorId,
      petIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(),
  )
}

describe('GetFeedUseCase', () => {
  let useCase: GetFeedUseCase
  let postRepo: jest.Mocked<PostRepository>
  let connectionRepo: jest.Mocked<ConnectionRepository>
  let blockRepo: jest.Mocked<BlockRepository>

  beforeEach(() => {
    postRepo = mockPostRepo()
    connectionRepo = mockConnectionRepo()
    blockRepo = mockBlockRepo()
    blockRepo.findBlockedUserIds.mockResolvedValue([])
    useCase = new GetFeedUseCase(postRepo, connectionRepo, blockRepo)
  })

  it('returns posts from the user and their followed users', async () => {
    connectionRepo.findFollowedIdsByUserId.mockResolvedValue([
      'user-2',
      'user-3',
    ])
    const posts = [makePost('user-1'), makePost('user-2')]
    postRepo.findFeed.mockResolvedValue({ items: posts, total: 2 })

    const result = await useCase.execute({
      userId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(connectionRepo.findFollowedIdsByUserId).toHaveBeenCalledWith(
      'user-1',
    )
    expect(postRepo.findFeed).toHaveBeenCalledWith(
      'user-1',
      ['user-2', 'user-3'],
      { page: 1, perPage: 10 },
      [],
    )
    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
  })

  it('returns only own posts when user has no followers', async () => {
    connectionRepo.findFollowedIdsByUserId.mockResolvedValue([])
    const posts = [makePost('user-1')]
    postRepo.findFeed.mockResolvedValue({ items: posts, total: 1 })

    const result = await useCase.execute({
      userId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(postRepo.findFeed).toHaveBeenCalledWith(
      'user-1',
      [],
      { page: 1, perPage: 10 },
      [],
    )
    expect(result.items).toHaveLength(1)
  })

  it('excludes followed users that are mutually blocked', async () => {
    connectionRepo.findFollowedIdsByUserId.mockResolvedValue([
      'user-2',
      'user-3',
    ])
    blockRepo.findBlockedUserIds.mockResolvedValue(['user-3'])
    postRepo.findFeed.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ userId: 'user-1', page: 1, perPage: 10 })

    expect(postRepo.findFeed).toHaveBeenCalledWith(
      'user-1',
      ['user-2'],
      { page: 1, perPage: 10 },
      ['user-3'],
    )
  })
})
