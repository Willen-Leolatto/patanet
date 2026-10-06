import { AnimalMedia, MediaType } from './animal-media'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('AnimalMedia entity', () => {
  it('exposes all props via getters', () => {
    const media = AnimalMedia.reconstitute(
      {
        text: 'A cute photo',
        path: 'https://cdn/photo.jpg',
        type: MediaType.IMAGE,
        animalId: 'animal-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('media-1'),
    )

    expect(media.text).toBe('A cute photo')
    expect(media.path).toBe('https://cdn/photo.jpg')
    expect(media.type).toBe(MediaType.IMAGE)
    expect(media.animalId).toBe('animal-1')
    expect(media.createdAt).toBeInstanceOf(Date)
    expect(media.updatedAt).toBeInstanceOf(Date)
  })

  it('creates with AnimalMedia.create()', () => {
    const media = AnimalMedia.create({
      text: null,
      path: 'https://cdn/video.mp4',
      type: MediaType.VIDEO,
      animalId: 'animal-1',
    })

    expect(media.type).toBe(MediaType.VIDEO)
    expect(media.text).toBeNull()
    expect(media.createdAt).toBeInstanceOf(Date)
  })
})
