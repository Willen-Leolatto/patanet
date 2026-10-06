import { NotFoundException } from '@nestjs/common'
import { EventRepository } from '../../domain/repositories/event.repository'
import { Event } from '../../domain/entities/event'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { StoragePort } from '@shared/application/ports/storage.port'
import { UpdateEventUseCase } from './update-event.use-case'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Post } from '@modules/posts/domain/entities/post'
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

const mockStoragePort = (): jest.Mocked<StoragePort> => ({
  upload: jest.fn(),
  delete: jest.fn(),
})

function makeEvent(
  overrides: Partial<{
    imageUrl: string
    postId: string
    authorId: string
  }> = {},
): Event {
  return Event.reconstitute(
    {
      title: 'Evento teste',
      description: null,
      date: null,
      time: null,
      locationText: null,
      latitude: null,
      longitude: null,
      imageUrl: overrides.imageUrl ?? null,
      postId: overrides.postId ?? 'post-1',
      authorId: overrides.authorId ?? 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('event-1'),
  )
}

function makePost(): Post {
  return Post.reconstitute(
    {
      subtitle: 'Evento teste',
      authorId: 'user-1',
      petIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('post-1'),
  )
}

describe('UpdateEventUseCase', () => {
  let useCase: UpdateEventUseCase
  let eventRepo: jest.Mocked<EventRepository>
  let postRepo: jest.Mocked<PostRepository>
  let mediaRepo: jest.Mocked<MediaRepository>
  let storagePort: jest.Mocked<StoragePort>

  beforeEach(() => {
    eventRepo = mockEventRepo()
    postRepo = mockPostRepo()
    mediaRepo = mockMediaRepo()
    storagePort = mockStoragePort()
    useCase = new UpdateEventUseCase(
      eventRepo,
      postRepo,
      mediaRepo,
      storagePort,
    )
  })

  it('updates event fields on happy path', async () => {
    const event = makeEvent()
    eventRepo.findById.mockResolvedValue(event)
    postRepo.findById.mockResolvedValue(makePost())
    eventRepo.save.mockResolvedValue(undefined)
    postRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      requesterId: 'user-1',
      eventId: 'event-1',
      title: 'Novo Título',
    })

    expect(result.title).toBe('Novo Título')
    expect(eventRepo.save).toHaveBeenCalled()
    expect(postRepo.save).toHaveBeenCalled()
  })

  it('throws NotFoundException when requester is not the author', async () => {
    const event = makeEvent({ authorId: 'user-1' })
    eventRepo.findById.mockResolvedValue(event)

    await expect(
      useCase.execute({
        requesterId: 'other-user',
        eventId: 'event-1',
        title: 'X',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(eventRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        requesterId: 'user-1',
        eventId: 'nonexistent',
        title: 'X',
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('replaces image: deletes old media from storage, removes media records, saves new media', async () => {
    const event = makeEvent({
      imageUrl: 'https://cdn/old.jpg',
      postId: 'post-1',
    })
    const media = Media.create({
      path: 'https://cdn/old.jpg',
      type: 'IMAGE',
      postId: 'post-1',
    })
    eventRepo.findById.mockResolvedValue(event)
    mediaRepo.findByPostId.mockResolvedValue([media])
    mediaRepo.deleteByPostId.mockResolvedValue(undefined)
    mediaRepo.save.mockResolvedValue(undefined)
    eventRepo.save.mockResolvedValue(undefined)
    storagePort.delete.mockResolvedValue(undefined)

    await useCase.execute({
      requesterId: 'user-1',
      eventId: 'event-1',
      imageUrl: 'https://cdn/new.jpg',
    })

    expect(storagePort.delete).toHaveBeenCalledTimes(1)
    expect(storagePort.delete).toHaveBeenCalledWith('https://cdn/old.jpg')
    expect(mediaRepo.deleteByPostId).toHaveBeenCalledWith('post-1')
    expect(mediaRepo.save).toHaveBeenCalled()
  })
})
