import { NotFoundException } from '@nestjs/common'
import { EventRepository } from '../../domain/repositories/event.repository'
import { Event } from '../../domain/entities/event'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { RepostEventUseCase } from './repost-event.use-case'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Post } from '@modules/posts/domain/entities/post'

const mockEventRepo = (): jest.Mocked<EventRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  trySetPostId: jest.fn(),
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

function makeEvent(
  postId: string | null = 'post-1',
  imageUrl: string | null = null,
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
      imageUrl,
      postId,
      authorId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('event-1'),
  )
}

function makePost(): Post {
  return Post.reconstitute(
    {
      subtitle: 'Evento',
      authorId: 'user-1',
      petIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('post-1'),
  )
}

describe('RepostEventUseCase', () => {
  let useCase: RepostEventUseCase
  let eventRepo: jest.Mocked<EventRepository>
  let postRepo: jest.Mocked<PostRepository>
  let mediaRepo: jest.Mocked<MediaRepository>

  beforeEach(() => {
    eventRepo = mockEventRepo()
    postRepo = mockPostRepo()
    mediaRepo = mockMediaRepo()
    useCase = new RepostEventUseCase(eventRepo, postRepo, mediaRepo)
  })

  it('returns event unchanged when linked post still exists', async () => {
    const event = makeEvent('post-1')
    eventRepo.findById.mockResolvedValue(event)
    postRepo.findById.mockResolvedValue(makePost())

    const result = await useCase.execute({
      requesterId: 'user-1',
      eventId: 'event-1',
    })

    expect(result.postId).toBe('post-1')
    expect(postRepo.save).not.toHaveBeenCalled()
    expect(eventRepo.save).not.toHaveBeenCalled()
  })

  it('creates a new post when the original post was deleted', async () => {
    const event = makeEvent('deleted-post-id')
    eventRepo.findById.mockResolvedValue(event)
    postRepo.findById.mockResolvedValue(null)
    postRepo.save.mockResolvedValue(undefined)
    eventRepo.trySetPostId.mockResolvedValue(true)

    const result = await useCase.execute({
      requesterId: 'user-1',
      eventId: 'event-1',
    })

    expect(result.postId).not.toBe('deleted-post-id')
    expect(postRepo.save).toHaveBeenCalledTimes(1)
    expect(eventRepo.trySetPostId).toHaveBeenCalledTimes(1)
  })

  it('creates a new post with image media when event has an image and post was deleted', async () => {
    const event = makeEvent('deleted-post', 'https://cdn/img.jpg')
    eventRepo.findById.mockResolvedValue(event)
    postRepo.findById.mockResolvedValue(null)
    postRepo.save.mockResolvedValue(undefined)
    mediaRepo.save.mockResolvedValue(undefined)
    eventRepo.trySetPostId.mockResolvedValue(true)

    await useCase.execute({ requesterId: 'user-1', eventId: 'event-1' })

    expect(postRepo.save).toHaveBeenCalledTimes(1)
    expect(mediaRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when requester is not the author', async () => {
    const event = makeEvent('post-1')
    eventRepo.findById.mockResolvedValue(event)

    await expect(
      useCase.execute({ requesterId: 'other-user', eventId: 'event-1' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws NotFoundException when event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ requesterId: 'user-1', eventId: 'nonexistent' }),
    ).rejects.toThrow(NotFoundException)
  })
})
