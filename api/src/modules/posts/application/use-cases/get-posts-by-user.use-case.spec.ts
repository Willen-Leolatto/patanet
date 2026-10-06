import { PostRepository } from '../../domain/repositories/post.repository'
import { BlockRepository } from '../../domain/repositories/block.repository'
import { GetPostsByUserUseCase } from './get-posts-by-user.use-case'

const mockPostRepo = (): jest.Mocked<PostRepository> => ({
  findById: jest.fn(),
  findFeed: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockBlockRepo = (): jest.Mocked<BlockRepository> => ({
  findBlockedUserIds: jest.fn(),
})

describe('GetPostsByUserUseCase', () => {
  let useCase: GetPostsByUserUseCase
  let postRepo: jest.Mocked<PostRepository>
  let blockRepo: jest.Mocked<BlockRepository>

  beforeEach(() => {
    postRepo = mockPostRepo()
    blockRepo = mockBlockRepo()
    blockRepo.findBlockedUserIds.mockResolvedValue([])
    useCase = new GetPostsByUserUseCase(postRepo, blockRepo)
  })

  it('returns posts for user', async () => {
    postRepo.findByUserId.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({
      userId: 'user-1',
      requesterId: 'user-2',
      page: 1,
      perPage: 10,
    })

    expect(postRepo.findByUserId).toHaveBeenCalledWith(
      'user-1',
      { page: 1, perPage: 10 },
      [],
    )
    expect(result.total).toBe(0)
  })

  it('excludes posts from mutually blocked users', async () => {
    blockRepo.findBlockedUserIds.mockResolvedValue(['blocked-1'])
    postRepo.findByUserId.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({
      userId: 'user-1',
      requesterId: 'user-2',
      page: 1,
      perPage: 10,
    })

    expect(postRepo.findByUserId).toHaveBeenCalledWith(
      'user-1',
      { page: 1, perPage: 10 },
      ['blocked-1'],
    )
  })
})
