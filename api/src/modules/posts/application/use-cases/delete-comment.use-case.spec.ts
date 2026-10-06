import { NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { CommentRepository } from '../../domain/repositories/comment.repository'
import { DeleteCommentUseCase } from './delete-comment.use-case'
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
      message: 'A comment',
      userId,
      postId,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('comment-1'),
  )
}

describe('DeleteCommentUseCase', () => {
  let useCase: DeleteCommentUseCase
  let postRepo: jest.Mocked<PostRepository>
  let commentRepo: jest.Mocked<CommentRepository>

  beforeEach(() => {
    postRepo = mockPostRepo()
    commentRepo = mockCommentRepo()
    useCase = new DeleteCommentUseCase(postRepo, commentRepo)
  })

  it('deletes the comment on happy path', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    commentRepo.findById.mockResolvedValue(makeComment('user-1', 'post-1'))
    commentRepo.delete.mockResolvedValue(undefined)

    await useCase.execute({
      requesterId: 'user-1',
      postId: 'post-1',
      commentId: 'comment-1',
    })

    expect(commentRepo.delete).toHaveBeenCalledWith('comment-1')
  })

  it('throws NotFoundException when post not found', async () => {
    postRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        requesterId: 'user-1',
        postId: 'post-1',
        commentId: 'comment-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(commentRepo.delete).not.toHaveBeenCalled()
  })

  it('does nothing when requester is not the author', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    commentRepo.findById.mockResolvedValue(makeComment('other-user', 'post-1'))

    await useCase.execute({
      requesterId: 'user-1',
      postId: 'post-1',
      commentId: 'comment-1',
    })

    expect(commentRepo.delete).not.toHaveBeenCalled()
  })

  it('does nothing when comment not found', async () => {
    postRepo.findById.mockResolvedValue(makePost())
    commentRepo.findById.mockResolvedValue(null)

    await useCase.execute({
      requesterId: 'user-1',
      postId: 'post-1',
      commentId: 'comment-1',
    })

    expect(commentRepo.delete).not.toHaveBeenCalled()
  })
})
