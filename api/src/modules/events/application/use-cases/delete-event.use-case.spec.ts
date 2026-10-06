import { EventRepository } from '../../domain/repositories/event.repository'
import { Event } from '../../domain/entities/event'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { CommentRepository } from '@modules/posts/domain/repositories/comment.repository'
import { LikeRepository } from '@modules/posts/domain/repositories/like.repository'
import { StoragePort } from '@shared/application/ports/storage.port'
import { DeleteEventUseCase } from './delete-event.use-case'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Media } from '@modules/posts/domain/entities/media'

const mockEventRepo = (): jest.Mocked<EventRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

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

function makeEvent(
  opts: { imageUrl?: string; postId?: string; authorId?: string } = {},
): Event {
  return Event.reconstitute(
    {
      title: 'Evento',
      description: null,
      date: null,
      time: null,
      locationText: null,
      latitude: null,
      longitude: null,
      imageUrl: opts.imageUrl ?? null,
      postId: opts.postId ?? null,
      authorId: opts.authorId ?? 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('event-1'),
  )
}

describe('DeleteEventUseCase', () => {
  let useCase: DeleteEventUseCase
  let eventRepo: jest.Mocked<EventRepository>
  let postRepo: jest.Mocked<PostRepository>
  let mediaRepo: jest.Mocked<MediaRepository>
  let commentRepo: jest.Mocked<CommentRepository>
  let likeRepo: jest.Mocked<LikeRepository>
  let storagePort: jest.Mocked<StoragePort>

  beforeEach(() => {
    eventRepo = mockEventRepo()
    postRepo = mockPostRepo()
    mediaRepo = mockMediaRepo()
    commentRepo = mockCommentRepo()
    likeRepo = mockLikeRepo()
    storagePort = mockStoragePort()
    useCase = new DeleteEventUseCase(
      eventRepo,
      postRepo,
      mediaRepo,
      commentRepo,
      likeRepo,
      storagePort,
    )
  })

  it('deletes event with linked post and media', async () => {
    const event = makeEvent({
      imageUrl: 'https://cdn/img.jpg',
      postId: 'post-1',
    })
    const media = Media.create({
      path: 'https://cdn/img.jpg',
      type: 'IMAGE',
      postId: 'post-1',
    })
    eventRepo.findById.mockResolvedValue(event)
    mediaRepo.findByPostId.mockResolvedValue([media])
    storagePort.delete.mockResolvedValue(undefined)
    commentRepo.deleteByPostId.mockResolvedValue(undefined)
    likeRepo.deleteByPostId.mockResolvedValue(undefined)
    mediaRepo.deleteByPostId.mockResolvedValue(undefined)
    postRepo.delete.mockResolvedValue(undefined)
    eventRepo.delete.mockResolvedValue(undefined)

    await useCase.execute({ requesterId: 'user-1', eventId: 'event-1' })

    expect(storagePort.delete).toHaveBeenCalledWith('https://cdn/img.jpg')
    expect(commentRepo.deleteByPostId).toHaveBeenCalledWith('post-1')
    expect(likeRepo.deleteByPostId).toHaveBeenCalledWith('post-1')
    expect(mediaRepo.deleteByPostId).toHaveBeenCalledWith('post-1')
    expect(postRepo.delete).toHaveBeenCalledWith('post-1')
    expect(eventRepo.delete).toHaveBeenCalledWith('event-1')
  })

  it('does nothing when requester is not the author', async () => {
    const event = makeEvent({ authorId: 'user-1' })
    eventRepo.findById.mockResolvedValue(event)

    await useCase.execute({ requesterId: 'other-user', eventId: 'event-1' })

    expect(eventRepo.delete).not.toHaveBeenCalled()
  })

  it('does nothing when event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(null)

    await useCase.execute({ requesterId: 'user-1', eventId: 'nonexistent' })

    expect(eventRepo.delete).not.toHaveBeenCalled()
    expect(storagePort.delete).not.toHaveBeenCalled()
  })
})
