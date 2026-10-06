import { NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { MediaRepository } from '../../domain/repositories/media.repository'
import { CommentRepository } from '../../domain/repositories/comment.repository'
import { LikeRepository } from '../../domain/repositories/like.repository'
import { StoragePort } from '@shared/application/ports/storage.port'
import { DeletePostUseCase } from './delete-post.use-case'
import { Post } from '../../domain/entities/post'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockPostRepo = (): jest.Mocked<PostRepository> => ({
  findById: jest.fn(),
  findFeed: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockMediaRepo = (): jest.Mocked<MediaRepository> => ({
  findByPostId: jest.fn(),
  save: jest.fn(),
  deleteByPostId: jest.fn(),
})

const mockCommentRepo = (): jest.Mocked<CommentRepository> => ({
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  deleteByPostId: jest.fn(),
})

const mockLikeRepo = (): jest.Mocked<LikeRepository> => ({
  findByUserAndPost: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  deleteByPostId: jest.fn(),
})

const mockStoragePort = (): jest.Mocked<StoragePort> => ({
  upload: jest.fn(),
  delete: jest.fn(),
})

function makePost(authorId: string): Post {
  return Post.reconstitute(
    {
      subtitle: 'Hello',
      authorId,
      petIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('post-1'),
  )
}

describe('DeletePostUseCase', () => {
  let useCase: DeletePostUseCase
  let postRepo: jest.Mocked<PostRepository>
  let mediaRepo: jest.Mocked<MediaRepository>
  let commentRepo: jest.Mocked<CommentRepository>
  let likeRepo: jest.Mocked<LikeRepository>
  let storagePort: jest.Mocked<StoragePort>

  beforeEach(() => {
    postRepo = mockPostRepo()
    mediaRepo = mockMediaRepo()
    commentRepo = mockCommentRepo()
    likeRepo = mockLikeRepo()
    storagePort = mockStoragePort()
    useCase = new DeletePostUseCase(
      postRepo,
      mediaRepo,
      commentRepo,
      likeRepo,
      storagePort,
    )
  })

  it('deletes post and related data on happy path', async () => {
    postRepo.findById.mockResolvedValue(makePost('user-1'))
    mediaRepo.findByPostId.mockResolvedValue([
      { path: 'https://cdn/img.jpg' } as any,
    ])
    storagePort.delete.mockResolvedValue(undefined)
    commentRepo.deleteByPostId.mockResolvedValue(undefined)
    likeRepo.deleteByPostId.mockResolvedValue(undefined)
    mediaRepo.deleteByPostId.mockResolvedValue(undefined)
    postRepo.delete.mockResolvedValue(undefined)

    await useCase.execute({ requesterId: 'user-1', postId: 'post-1' })

    expect(storagePort.delete).toHaveBeenCalledWith('https://cdn/img.jpg')
    expect(commentRepo.deleteByPostId).toHaveBeenCalledWith('post-1')
    expect(likeRepo.deleteByPostId).toHaveBeenCalledWith('post-1')
    expect(postRepo.delete).toHaveBeenCalledWith('post-1')
  })

  it('throws NotFoundException when post not found', async () => {
    postRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ requesterId: 'user-1', postId: 'post-1' }),
    ).rejects.toThrow(NotFoundException)

    expect(postRepo.delete).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when requester is not author', async () => {
    postRepo.findById.mockResolvedValue(makePost('other-user'))

    await expect(
      useCase.execute({ requesterId: 'user-1', postId: 'post-1' }),
    ).rejects.toThrow(NotFoundException)

    expect(postRepo.delete).not.toHaveBeenCalled()
  })
})
