import { Breed } from './breed'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Breed entity', () => {
  it('exposes all props via getters', () => {
    const breed = Breed.reconstitute(
      {
        name: 'Labrador',
        about: 'Friendly dog',
        appearance: 'Short coat',
        temperament: 'Friendly',
        trainability: 'High',
        exercise: 'High',
        coat: 'Short',
        health: 'Good',
        suggestedSize: 'Large',
        typicalWeight: '30-40kg',
        typicalHeight: '55-62cm',
        lifeExpectancy: '10-12 years',
        image: 'https://cdn/lab.jpg',
        specieId: 'specie-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        specie: { id: 'specie-1', name: 'Dog', image: null },
      },
      new UniqueEntityID('breed-1'),
    )

    expect(breed.name).toBe('Labrador')
    expect(breed.about).toBe('Friendly dog')
    expect(breed.appearance).toBe('Short coat')
    expect(breed.temperament).toBe('Friendly')
    expect(breed.trainability).toBe('High')
    expect(breed.exercise).toBe('High')
    expect(breed.coat).toBe('Short')
    expect(breed.health).toBe('Good')
    expect(breed.suggestedSize).toBe('Large')
    expect(breed.typicalWeight).toBe('30-40kg')
    expect(breed.typicalHeight).toBe('55-62cm')
    expect(breed.lifeExpectancy).toBe('10-12 years')
    expect(breed.image).toBe('https://cdn/lab.jpg')
    expect(breed.specieId).toBe('specie-1')
    expect(breed.createdAt).toBeInstanceOf(Date)
    expect(breed.updatedAt).toBeInstanceOf(Date)
    expect(breed.specie?.name).toBe('Dog')
  })
})
