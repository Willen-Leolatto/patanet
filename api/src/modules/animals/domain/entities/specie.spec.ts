import { Specie } from './specie'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Specie entity', () => {
  it('exposes all props via getters', () => {
    const specie = Specie.reconstitute(
      {
        name: 'Dog',
        image: 'https://cdn/dog.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('specie-1'),
    )

    expect(specie.name).toBe('Dog')
    expect(specie.image).toBe('https://cdn/dog.jpg')
    expect(specie.createdAt).toBeInstanceOf(Date)
    expect(specie.updatedAt).toBeInstanceOf(Date)
  })
})
