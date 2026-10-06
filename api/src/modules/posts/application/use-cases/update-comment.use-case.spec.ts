import { NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { CommentRepository } from '../../domain/repositories/comment.repository'
import { UpdateCommentUseCase } from './update-comment.use-case'
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

function makeComment(userId = 'user-1', postId = 'post-1'): Comment {
  return Comment.reconstitute(
    {
      message: 'Original message',
      userId,
      postId,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('comment-1'),
  )
}

describe('UpdateCommentUseCase', () => {
  let useCase: UpdateCommentUseCase
  let postRepo: jest.Mocked<PostRepository>
  let commentRepo: jest.Mocked<CommentRepository>

  beforeEach(() => {
    postRepo = mockPostRepo()
    commentRepo = mockCommentRepo()
    useCase = new UpdateCommentUseCase(postRepo, commentRepo)
  })

  it('updates the comment on happy path', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    const comment = makeComment('user-1', 'post-1')
    commentRepo.findById.mockResolvedValueOnce(comment)
    commentRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      requesterId: 'user-1',
      postId: 'post-1',
      commentId: 'comment-1',
      message: 'Updated message',
    })

    expect(commentRepo.save).toHaveBeenCalledTimes(1)
    expect(result.message).toBe('Updated message')
  })

  it('throws NotFoundException when post not found', async () => {
    postRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        requesterId: 'user-1',
        postId: 'post-1',
        commentId: 'comment-1',
        message: 'Updated',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(commentRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when requester is not the author', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    const comment = makeComment('other-user', 'post-1')
    commentRepo.findById.mockResolvedValue(comment)

    await expect(
      useCase.execute({
        requesterId: 'user-1',
        postId: 'post-1',
        commentId: 'comment-1',
        message: 'Updated',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(commentRepo.save).not.toHaveBeenCalled()
  })
})
