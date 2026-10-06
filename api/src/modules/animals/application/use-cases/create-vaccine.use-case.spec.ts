import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { VaccineRepository } from '../../domain/repositories/vaccine.repository'
import { CreateVaccineUseCase } from './create-vaccine.use-case'
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

const mockVaccineRepo = (): jest.Mocked<VaccineRepository> => ({
  findById: jest.fn(),
  findByAnimal: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

function makeAnimal(ownerId: string): Animal {
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
      ownerId,
      createdByOwnerId: ownerId,
      ownerIds: new OwnerIdList([ownerId]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('animal-1'),
  )
}

const baseInput = {
  animalId: 'animal-1',
  requesterId: 'user-1',
  name: 'Raiva',
  clinic: 'VetClinic',
}

describe('CreateVaccineUseCase', () => {
  let useCase: CreateVaccineUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let vaccineRepo: jest.Mocked<VaccineRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    vaccineRepo = mockVaccineRepo()
    useCase = new CreateVaccineUseCase(vaccineRepo, animalRepo)
  })

  it('creates vaccine on happy path', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    vaccineRepo.save.mockResolvedValue(undefined)

    await useCase.execute(baseInput)

    expect(vaccineRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException)
    expect(vaccineRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when requester is not owner', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('other-user'))

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException)
    expect(vaccineRepo.save).not.toHaveBeenCalled()
  })
})
