import { NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { CommentRepository } from '../../domain/repositories/comment.repository'
import { CreateCommentUseCase } from './create-comment.use-case'
import { Post } from '../../domain/entities/post'
import { Comment } from '../../domain/entities/comment'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockPostRepo = (): jest.Mocked<PostRepository> => ({
  findById: jest.fn(),
  findFeed: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockCommentRepo = (): jest.Mocked<CommentRepository> => ({
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  deleteByPostId: jest.fn(),
})

function makePost(id = 'post-1'): Post {
  return Post.reconstitute(
    {
      subtitle: 'Post',
      authorId: 'author-1',
      petIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

function makeComment(id = 'comment-1', postId = 'post-1'): Comment {
  return Comment.reconstitute(
    {
      message: 'Parent comment',
      userId: 'user-2',
      postId,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('CreateCommentUseCase', () => {
  let useCase: CreateCommentUseCase
  let postRepo: jest.Mocked<PostRepository>
  let commentRepo: jest.Mocked<CommentRepository>

  beforeEach(() => {
    postRepo = mockPostRepo()
    commentRepo = mockCommentRepo()
    useCase = new CreateCommentUseCase(postRepo, commentRepo)
  })

  it('creates a root comment on happy path', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    commentRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      userId: 'user-1',
      postId: 'post-1',
      message: 'Hello!',
    })

    expect(result.message).toBe('Hello!')
    expect(result.userId).toBe('user-1')
    expect(commentRepo.save).toHaveBeenCalledTimes(1)
  })

  it('creates a reply when parentId is provided and parent exists', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    const parentComment = makeComment('parent-1')
    commentRepo.findById.mockResolvedValueOnce(parentComment)
    commentRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      userId: 'user-1',
      postId: 'post-1',
      message: 'A reply',
      parentId: 'parent-1',
    })

    expect(result.message).toBe('A reply')
    expect(result.parentId).toBe('parent-1')
    expect(commentRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when post not found', async () => {
    postRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ userId: 'user-1', postId: 'post-1', message: 'Hello' }),
    ).rejects.toThrow(NotFoundException)
    expect(commentRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when parent comment not found', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    commentRepo.findById.mockResolvedValue(null) // parent not found

    await expect(
      useCase.execute({
        userId: 'user-1',
        postId: 'post-1',
        message: 'Reply',
        parentId: 'nonexistent-parent',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(commentRepo.save).not.toHaveBeenCalled()
  })
})
