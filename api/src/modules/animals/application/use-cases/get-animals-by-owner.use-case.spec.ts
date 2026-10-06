import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { AnimalMediaRepository } from '../../domain/repositories/animal-media.repository'
import { AnimalVisibilityRepository } from '../../domain/repositories/animal-visibility.repository'
import { GetAnimalsByOwnerUseCase } from './get-animals-by-owner.use-case'
import { Animal } from '../../domain/entities/animal'
import { OwnerIdList } from '../../domain/watched-list/owner-id-list'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockAnimalMediaRepo = (): jest.Mocked<AnimalMediaRepository> => ({
  findById: jest.fn(),
  findByAnimal: jest.fn(),
  countByAnimal: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockVisibilityRepo = (): jest.Mocked<AnimalVisibilityRepository> => ({
  findHiddenIdsByUser: jest.fn(),
  upsert: jest.fn(),
})

function makeAnimal(id: string): Animal {
  return Animal.reconstitute(
    {
      name: 'Rex',
      about: null,
      image: null,
      imageCover: null,
      weight: 10,
      size: 'MEDIUM',
      gender: 'MALE',
      birthDate: null,
      adoptionDate: null,
      breedId: 'breed-1',
      ownerId: 'user-1',
      createdByOwnerId: 'user-1',
      ownerIds: new OwnerIdList(['user-1']),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('GetAnimalsByOwnerUseCase', () => {
  let useCase: GetAnimalsByOwnerUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let mediaRepo: jest.Mocked<AnimalMediaRepository>
  let visibilityRepo: jest.Mocked<AnimalVisibilityRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    mediaRepo = mockAnimalMediaRepo()
    visibilityRepo = mockVisibilityRepo()
    useCase = new GetAnimalsByOwnerUseCase(
      animalRepo,
      mediaRepo,
      visibilityRepo,
    )
  })

  it('returns visible animals for owner', async () => {
    const a1 = makeAnimal('animal-1')
    const a2 = makeAnimal('animal-2')
    animalRepo.findByOwner.mockResolvedValue({ items: [a1, a2], total: 2 })
    visibilityRepo.findHiddenIdsByUser.mockResolvedValue([])
    mediaRepo.countByAnimal.mockResolvedValue(0)

    const result = await useCase.execute({
      ownerId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
  })

  it('filters out hidden animals', async () => {
    const a1 = makeAnimal('animal-1')
    const a2 = makeAnimal('animal-2')
    animalRepo.findByOwner.mockResolvedValue({ items: [a1, a2], total: 2 })
    visibilityRepo.findHiddenIdsByUser.mockResolvedValue(['animal-2'])
    mediaRepo.countByAnimal.mockResolvedValue(3)

    const result = await useCase.execute({
      ownerId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id.toValue()).toBe('animal-1')
  })
})
