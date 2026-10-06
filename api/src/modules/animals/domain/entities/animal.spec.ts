import { Animal } from './animal'
import { OwnerIdList } from '../watched-list/owner-id-list'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

function makeAnimal(): Animal {
  return Animal.reconstitute(
    {
      name: 'Rex',
      about: 'Good boy',
      image: 'https://cdn/rex.jpg',
      imageCover: 'https://cdn/cover.jpg',
      weight: 10,
      size: 'MEDIUM',
      gender: 'MALE',
      birthDate: new Date('2020-01-01'),
      adoptionDate: new Date('2021-01-01'),
      breedId: 'breed-1',
      ownerId: 'user-1',
      createdByOwnerId: 'user-1',
      ownerIds: new OwnerIdList(['user-1']),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      breed: { id: 'breed-1', name: 'Labrador', image: null },
      owners: [
        {
          id: 'user-1',
          name: 'John',
          username: 'john',
          email: 'john@test.com',
          image: null,
          imageCover: null,
        },
      ],
      mediasCount: 3,
    },
    new UniqueEntityID('animal-1'),
  )
}

describe('Animal entity', () => {
  it('exposes all props via getters', () => {
    const animal = makeAnimal()

    expect(animal.name).toBe('Rex')
    expect(animal.about).toBe('Good boy')
    expect(animal.image).toBe('https://cdn/rex.jpg')
    expect(animal.imageCover).toBe('https://cdn/cover.jpg')
    expect(animal.weight).toBe(10)
    expect(animal.size).toBe('MEDIUM')
    expect(animal.gender).toBe('MALE')
    expect(animal.birthDate).toBeInstanceOf(Date)
    expect(animal.adoptionDate).toBeInstanceOf(Date)
    expect(animal.breedId).toBe('breed-1')
    expect(animal.ownerId).toBe('user-1')
    expect(animal.createdByOwnerId).toBe('user-1')
    expect(animal.ownerIds).toBeDefined()
    expect(animal.createdAt).toBeInstanceOf(Date)
    expect(animal.updatedAt).toBeInstanceOf(Date)
    expect(animal.breed?.name).toBe('Labrador')
    expect(animal.owners).toHaveLength(1)
    expect(animal.mediasCount).toBe(3)
  })

  it('setMediasCount updates mediasCount', () => {
    const animal = makeAnimal()
    animal.setMediasCount(5)
    expect(animal.mediasCount).toBe(5)
  })
})
