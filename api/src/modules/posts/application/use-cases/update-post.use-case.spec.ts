import { NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { MediaRepository } from '../../domain/repositories/media.repository'
import { StoragePort } from '@shared/application/ports/storage.port'
import { UpdatePostUseCase } from './update-post.use-case'
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

describe('UpdatePostUseCase', () => {
  let useCase: UpdatePostUseCase
  let postRepo: jest.Mocked<PostRepository>
  let mediaRepo: jest.Mocked<MediaRepository>
  let storagePort: jest.Mocked<StoragePort>

  beforeEach(() => {
    postRepo = mockPostRepo()
    mediaRepo = mockMediaRepo()
    storagePort = mockStoragePort()
    useCase = new UpdatePostUseCase(postRepo, mediaRepo, storagePort)
  })

  it('updates post on happy path', async () => {
    postRepo.findById.mockResolvedValue(makePost('user-1'))
    postRepo.save.mockResolvedValue(undefined)

    await useCase.execute({
      requesterId: 'user-1',
      postId: 'post-1',
      subtitle: 'Updated',
    })

    expect(postRepo.save).toHaveBeenCalledTimes(1)
    expect(mediaRepo.findByPostId).not.toHaveBeenCalled()
  })

  it('replaces medias when new medias provided', async () => {
    postRepo.findById.mockResolvedValue(makePost('user-1'))
    postRepo.save.mockResolvedValue(undefined)
    mediaRepo.findByPostId.mockResolvedValue([
      { path: 'https://cdn/old.jpg' } as any,
    ])
    storagePort.delete.mockResolvedValue(undefined)
    mediaRepo.deleteByPostId.mockResolvedValue(undefined)
    mediaRepo.save.mockResolvedValue(undefined)

    await useCase.execute({
      requesterId: 'user-1',
      postId: 'post-1',
      medias: [{ path: 'https://cdn/new.jpg', type: 'IMAGE' as any }],
    })

    expect(storagePort.delete).toHaveBeenCalledWith('https://cdn/old.jpg')
    expect(mediaRepo.deleteByPostId).toHaveBeenCalledWith('post-1')
    expect(mediaRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when post not found', async () => {
    postRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ requesterId: 'user-1', postId: 'post-1' }),
    ).rejects.toThrow(NotFoundException)
    expect(postRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when requester is not author', async () => {
    postRepo.findById.mockResolvedValue(makePost('other-user'))

    await expect(
      useCase.execute({ requesterId: 'user-1', postId: 'post-1' }),
    ).rejects.toThrow(NotFoundException)
    expect(postRepo.save).not.toHaveBeenCalled()
  })
})
