import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { DewormingRepository } from '../../domain/repositories/deworming.repository'
import { DeleteDewormingUseCase } from './delete-deworming.use-case'
import { Animal } from '../../domain/entities/animal'
import { Deworming } from '../../domain/entities/deworming'
import { OwnerIdList } from '../../domain/watched-list/owner-id-list'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockDewormingRepo = (): jest.Mocked<DewormingRepository> => ({
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

function makeDeworming(animalId: string): Deworming {
  return Deworming.reconstitute(
    {
      name: 'Frontline',
      observations: null,
      clinic: null,
      appliedAt: null,
      nextDose: null,
      animalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('deworming-1'),
  )
}

describe('DeleteDewormingUseCase', () => {
  let useCase: DeleteDewormingUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let dewormingRepo: jest.Mocked<DewormingRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    dewormingRepo = mockDewormingRepo()
    useCase = new DeleteDewormingUseCase(dewormingRepo, animalRepo)
  })

  it('deletes deworming on happy path', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    dewormingRepo.findById.mockResolvedValue(makeDeworming('animal-1'))
    dewormingRepo.delete.mockResolvedValue(undefined)

    await useCase.execute({
      animalId: 'animal-1',
      dewormingId: 'deworming-1',
      requesterId: 'user-1',
    })

    expect(dewormingRepo.delete).toHaveBeenCalledWith('deworming-1')
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        dewormingId: 'deworming-1',
        requesterId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(dewormingRepo.delete).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when deworming not found', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    dewormingRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        dewormingId: 'deworming-1',
        requesterId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(dewormingRepo.delete).not.toHaveBeenCalled()
  })
})
