import { PostRepository } from '../../domain/repositories/post.repository'
import { MediaRepository } from '../../domain/repositories/media.repository'
import { CreatePostUseCase } from './create-post.use-case'

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

describe('CreatePostUseCase', () => {
  let useCase: CreatePostUseCase
  let postRepo: jest.Mocked<PostRepository>
  let mediaRepo: jest.Mocked<MediaRepository>

  beforeEach(() => {
    postRepo = mockPostRepo()
    mediaRepo = mockMediaRepo()
    useCase = new CreatePostUseCase(postRepo, mediaRepo)
  })

  it('creates a post without media on happy path', async () => {
    postRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      authorId: 'user-1',
      subtitle: 'Hello world',
    })

    expect(result.subtitle).toBe('Hello world')
    expect(result.authorId).toBe('user-1')
    expect(postRepo.save).toHaveBeenCalledTimes(1)
    expect(mediaRepo.save).not.toHaveBeenCalled()
  })

  it('creates a post with medias', async () => {
    postRepo.save.mockResolvedValue(undefined)
    mediaRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      authorId: 'user-1',
      subtitle: 'With media',
      medias: [
        { path: 'https://cdn/img1.jpg', type: 'IMAGE' },
        { path: 'https://cdn/img2.jpg', type: 'IMAGE' },
      ],
    })

    expect(result.subtitle).toBe('With media')
    expect(postRepo.save).toHaveBeenCalledTimes(1)
    expect(mediaRepo.save).toHaveBeenCalledTimes(2)
  })

  it('creates a post without subtitle — subtitle is empty string', async () => {
    postRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({ authorId: 'user-1', subtitle: '' })

    expect(result.subtitle).toBe('')
    expect(postRepo.save).toHaveBeenCalledTimes(1)
  })
})
