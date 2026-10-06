import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { MedicationRepository } from '../../domain/repositories/medication.repository'
import { UpdateMedicationUseCase } from './update-medication.use-case'
import { Animal } from '../../domain/entities/animal'
import { Medication } from '../../domain/entities/medication'
import { OwnerIdList } from '../../domain/watched-list/owner-id-list'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockMedicationRepo = (): jest.Mocked<MedicationRepository> => ({
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

function makeMedication(animalId: string): Medication {
  return Medication.reconstitute(
    {
      name: 'Amoxicillin',
      startAt: null,
      endAt: null,
      dosage: null,
      frequency: null,
      clinic: null,
      observations: null,
      animalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('medication-1'),
  )
}

describe('UpdateMedicationUseCase', () => {
  let useCase: UpdateMedicationUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let medicationRepo: jest.Mocked<MedicationRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    medicationRepo = mockMedicationRepo()
    useCase = new UpdateMedicationUseCase(medicationRepo, animalRepo)
  })

  it('updates medication on happy path', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    medicationRepo.findById.mockResolvedValue(makeMedication('animal-1'))
    medicationRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      animalId: 'animal-1',
      medicationId: 'medication-1',
      requesterId: 'user-1',
      name: 'Updated Med',
      startAt: '2024-01-01',
    })

    expect(result.name).toBe('Updated Med')
    expect(medicationRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        medicationId: 'medication-1',
        requesterId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(medicationRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when medication not found', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    medicationRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        medicationId: 'medication-1',
        requesterId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(medicationRepo.save).not.toHaveBeenCalled()
  })
})
