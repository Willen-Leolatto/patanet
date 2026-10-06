import { NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { BlockRepository } from '../../domain/repositories/block.repository'
import { GetPostByIdUseCase } from './get-post-by-id.use-case'
import { Post } from '../../domain/entities/post'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

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

function makePost(): Post {
  return Post.reconstitute(
    {
      subtitle: 'Hello',
      authorId: 'user-1',
      petIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('post-1'),
  )
}

describe('GetPostByIdUseCase', () => {
  let useCase: GetPostByIdUseCase
  let postRepo: jest.Mocked<PostRepository>
  let blockRepo: jest.Mocked<BlockRepository>

  beforeEach(() => {
    postRepo = mockPostRepo()
    blockRepo = mockBlockRepo()
    blockRepo.findBlockedUserIds.mockResolvedValue([])
    useCase = new GetPostByIdUseCase(postRepo, blockRepo)
  })

  it('returns post on happy path', async () => {
    const post = makePost()
    postRepo.findById.mockResolvedValue(post)

    const result = await useCase.execute({
      postId: 'post-1',
      requesterId: 'user-2',
    })

    expect(result).toBe(post)
    expect(postRepo.findById).toHaveBeenCalledWith('post-1', [])
  })

  it('excludes posts from mutually blocked users', async () => {
    blockRepo.findBlockedUserIds.mockResolvedValue(['blocked-1'])
    postRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ postId: 'post-1', requesterId: 'user-2' }),
    ).rejects.toThrow(NotFoundException)
    expect(postRepo.findById).toHaveBeenCalledWith('post-1', ['blocked-1'])
  })

  it('throws NotFoundException when post not found', async () => {
    postRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ postId: 'post-1', requesterId: 'user-2' }),
    ).rejects.toThrow(NotFoundException)
  })
})
