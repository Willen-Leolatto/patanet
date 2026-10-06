import { NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { LikeRepository } from '../../domain/repositories/like.repository'
import { ToggleLikeUseCase } from './toggle-like.use-case'
import { Post } from '../../domain/entities/post'
import { Like } from '../../domain/entities/like'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockPostRepo = (): jest.Mocked<PostRepository> => ({
  findById: jest.fn(),
  findFeed: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockLikeRepo = (): jest.Mocked<LikeRepository> => ({
  findByUserAndPost: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  deleteByPostId: jest.fn(),
})

function makePost(): Post {
  return Post.reconstitute(
    {
      subtitle: 'A post',
      authorId: 'author-1',
      petIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('post-1'),
  )
}

function makeLike(): Like {
  return Like.reconstitute(
    {
      userId: 'user-1',
      postId: 'post-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('like-1'),
  )
}

describe('ToggleLikeUseCase', () => {
  let useCase: ToggleLikeUseCase
  let postRepo: jest.Mocked<PostRepository>
  let likeRepo: jest.Mocked<LikeRepository>

  beforeEach(() => {
    postRepo = mockPostRepo()
    likeRepo = mockLikeRepo()
    useCase = new ToggleLikeUseCase(postRepo, likeRepo)
  })

  it('throws NotFoundException when post does not exist', async () => {
    postRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ userId: 'user-1', postId: 'post-1', action: 'like' }),
    ).rejects.toThrow(NotFoundException)
    expect(likeRepo.save).not.toHaveBeenCalled()
  })

  it('creates a like when user has not liked the post yet', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    likeRepo.findByUserAndPost.mockResolvedValue(null)
    likeRepo.save.mockResolvedValue(undefined)

    await useCase.execute({ userId: 'user-1', postId: 'post-1', action: 'like' })

    expect(likeRepo.save).toHaveBeenCalledTimes(1)
    expect(likeRepo.delete).not.toHaveBeenCalled()
  })

  it('removes a like when user has already liked the post', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    const like = makeLike()
    likeRepo.findByUserAndPost.mockResolvedValue(like)
    likeRepo.delete.mockResolvedValue(undefined)

    await useCase.execute({ userId: 'user-1', postId: 'post-1', action: 'unlike' })

    expect(likeRepo.delete).toHaveBeenCalledWith(like.id.toValue())
    expect(likeRepo.save).not.toHaveBeenCalled()
  })
})
