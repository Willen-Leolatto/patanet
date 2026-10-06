import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { VaccineRepository } from '../../domain/repositories/vaccine.repository'
import { UpdateVaccineUseCase } from './update-vaccine.use-case'
import { Animal } from '../../domain/entities/animal'
import { Vaccine } from '../../domain/entities/vaccine'
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

function makeVaccine(animalId: string): Vaccine {
  return Vaccine.reconstitute(
    {
      name: 'Raiva',
      observations: '',
      clinic: 'VetClinic',
      appliedAt: null,
      nextDose: null,
      animalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('vaccine-1'),
  )
}

describe('UpdateVaccineUseCase', () => {
  let useCase: UpdateVaccineUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let vaccineRepo: jest.Mocked<VaccineRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    vaccineRepo = mockVaccineRepo()
    useCase = new UpdateVaccineUseCase(vaccineRepo, animalRepo)
  })

  it('updates vaccine on happy path', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    vaccineRepo.findById.mockResolvedValue(makeVaccine('animal-1'))
    vaccineRepo.save.mockResolvedValue(undefined)

    await useCase.execute({
      animalId: 'animal-1',
      vaccineId: 'vaccine-1',
      requesterId: 'user-1',
      name: 'Updated Vaccine',
    })

    expect(vaccineRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        vaccineId: 'vaccine-1',
        requesterId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(vaccineRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when vaccine not found', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    vaccineRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        vaccineId: 'vaccine-1',
        requesterId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(vaccineRepo.save).not.toHaveBeenCalled()
  })
})
