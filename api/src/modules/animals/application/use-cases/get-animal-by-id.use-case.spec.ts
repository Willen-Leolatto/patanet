import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { GetAnimalByIdUseCase } from './get-animal-by-id.use-case'
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

function makeAnimal(): Animal {
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
    new UniqueEntityID('animal-1'),
  )
}

describe('GetAnimalByIdUseCase', () => {
  let useCase: GetAnimalByIdUseCase
  let animalRepo: jest.Mocked<AnimalRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    useCase = new GetAnimalByIdUseCase(animalRepo)
  })

  it('returns animal on happy path', async () => {
    const animal = makeAnimal()
    animalRepo.findById.mockResolvedValue(animal)

    const result = await useCase.execute({ id: 'animal-1' })

    expect(result).toBe(animal)
    expect(animalRepo.findById).toHaveBeenCalledWith('animal-1')
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(useCase.execute({ id: 'animal-1' })).rejects.toThrow(
      NotFoundException,
    )
  })
})
