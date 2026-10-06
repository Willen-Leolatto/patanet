import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { TutorManagementDomainService } from '../../domain/services/tutor-management.domain-service'
import { RemoveTutorUseCase } from './remove-tutor.use-case'
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

function makeAnimal(ownerId: string, ownerIds: string[]): Animal {
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
      ownerIds: new OwnerIdList(ownerIds),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('animal-1'),
  )
}

describe('RemoveTutorUseCase', () => {
  let useCase: RemoveTutorUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let tutorService: TutorManagementDomainService

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    tutorService = new TutorManagementDomainService()
    useCase = new RemoveTutorUseCase(animalRepo, tutorService)
  })

  it('removes tutor on happy path', async () => {
    const animal = makeAnimal('primary', ['primary', 'secondary'])
    animalRepo.findById.mockResolvedValue(animal)
    animalRepo.save.mockResolvedValue(undefined)

    await useCase.execute({
      animalId: 'animal-1',
      ownerId: 'secondary',
      requesterId: 'primary',
    })

    expect(animal.ownerIds.getItems()).not.toContain('secondary')
    expect(animalRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws ForbiddenException when primary tries to remove itself', async () => {
    const animal = makeAnimal('primary', ['primary', 'secondary'])
    animalRepo.findById.mockResolvedValue(animal)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        ownerId: 'primary',
        requesterId: 'primary',
      }),
    ).rejects.toThrow(ForbiddenException)

    expect(animalRepo.save).not.toHaveBeenCalled()
  })

  it('throws ForbiddenException when trying to remove the last tutor', async () => {
    const animal = makeAnimal('primary', ['primary'])
    animalRepo.findById.mockResolvedValue(animal)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        ownerId: 'secondary',
        requesterId: 'primary',
      }),
    ).rejects.toThrow(ForbiddenException)

    expect(animalRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        ownerId: 'secondary',
        requesterId: 'primary',
      }),
    ).rejects.toThrow(NotFoundException)
  })
})
