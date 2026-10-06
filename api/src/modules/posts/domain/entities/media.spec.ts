import { Media } from './media'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Media entity', () => {
  it('exposes all props via getters', () => {
    const media = Media.reconstitute(
      {
        path: 'https://cdn/img.jpg',
        type: 'IMAGE',
        postId: 'post-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('media-1'),
    )

    expect(media.path).toBe('https://cdn/img.jpg')
    expect(media.type).toBe('IMAGE')
    expect(media.postId).toBe('post-1')
    expect(media.createdAt).toBeInstanceOf(Date)
    expect(media.updatedAt).toBeInstanceOf(Date)
  })

  it('creates with Media.create()', () => {
    const media = Media.create({
      path: 'https://cdn/video.mp4',
      type: 'VIDEO',
      postId: 'post-1',
    })

    expect(media.type).toBe('VIDEO')
    expect(media.postId).toBe('post-1')
    expect(media.createdAt).toBeInstanceOf(Date)
  })
})
