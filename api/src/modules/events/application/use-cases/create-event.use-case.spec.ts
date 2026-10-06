import { BadRequestException } from '@nestjs/common'
import { EventRepository } from '../../domain/repositories/event.repository'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { CreateEventUseCase } from './create-event.use-case'

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

describe('CreateEventUseCase', () => {
  let useCase: CreateEventUseCase
  let eventRepo: jest.Mocked<EventRepository>
  let postRepo: jest.Mocked<PostRepository>
  let mediaRepo: jest.Mocked<MediaRepository>

  beforeEach(() => {
    eventRepo = mockEventRepo()
    postRepo = mockPostRepo()
    mediaRepo = mockMediaRepo()
    useCase = new CreateEventUseCase(eventRepo, postRepo, mediaRepo)
  })

  it('creates an event and a linked post without image', async () => {
    postRepo.save.mockResolvedValue(undefined)
    eventRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      authorId: 'user-1',
      title: 'Festa Junina',
    })

    expect(result.title).toBe('Festa Junina')
    expect(result.authorId).toBe('user-1')
    expect(result.postId).toBeDefined()
    expect(postRepo.save).toHaveBeenCalledTimes(1)
    expect(mediaRepo.save).not.toHaveBeenCalled()
    expect(eventRepo.save).toHaveBeenCalledTimes(1)
  })

  it('creates an event and a linked post with image', async () => {
    postRepo.save.mockResolvedValue(undefined)
    mediaRepo.save.mockResolvedValue(undefined)
    eventRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      authorId: 'user-1',
      title: 'Festa com foto',
      imageUrl: 'https://cdn/img.jpg',
    })

    expect(result.imageUrl).toBe('https://cdn/img.jpg')
    expect(postRepo.save).toHaveBeenCalledTimes(1)
    expect(mediaRepo.save).toHaveBeenCalledTimes(1)
    expect(eventRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws BadRequestException when title is empty', async () => {
    await expect(
      useCase.execute({ authorId: 'user-1', title: '   ' }),
    ).rejects.toThrow(BadRequestException)
    expect(postRepo.save).not.toHaveBeenCalled()
    expect(eventRepo.save).not.toHaveBeenCalled()
  })

  it('trims whitespace from title', async () => {
    postRepo.save.mockResolvedValue(undefined)
    eventRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      authorId: 'user-1',
      title: '  Meu Evento  ',
    })

    expect(result.title).toBe('Meu Evento')
  })
})
