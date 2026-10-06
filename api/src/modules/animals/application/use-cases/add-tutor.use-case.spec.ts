import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { TutorManagementDomainService } from '../../domain/services/tutor-management.domain-service'
import { AddTutorUseCase } from './add-tutor.use-case'
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

const mockUserRepo = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByIdWithAnimalsCount: jest.fn(),
  findByEmail: jest.fn(),
  findByGoogleId: jest.fn(),
  findByUsername: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  purge: jest.fn(),
})

function makeAnimal(ownerId: string, extraOwnerIds: string[] = []): Animal {
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
      ownerIds: new OwnerIdList([ownerId, ...extraOwnerIds]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('animal-1'),
  )
}

describe('AddTutorUseCase', () => {
  let useCase: AddTutorUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let userRepo: jest.Mocked<UserRepository>
  let tutorService: TutorManagementDomainService

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    userRepo = mockUserRepo()
    tutorService = new TutorManagementDomainService()
    useCase = new AddTutorUseCase(animalRepo, userRepo, tutorService)
  })

  it('adds tutor on happy path', async () => {
    const animal = makeAnimal('primary-user')
    animalRepo.findById.mockResolvedValue(animal)
    userRepo.findById.mockResolvedValue({
      id: { toValue: () => 'new-user' },
    } as any)
    animalRepo.save.mockResolvedValue(undefined)

    await useCase.execute({
      animalId: 'animal-1',
      newOwnerId: 'new-user',
      requesterId: 'primary-user',
    })

    expect(animal.ownerIds.getItems()).toContain('new-user')
    expect(animalRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws ForbiddenException when requester is not primary tutor', async () => {
    const animal = makeAnimal('primary-user', ['secondary-user'])
    animalRepo.findById.mockResolvedValue(animal)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        newOwnerId: 'another-user',
        requesterId: 'secondary-user',
      }),
    ).rejects.toThrow(ForbiddenException)

    expect(animalRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        newOwnerId: 'new-user',
        requesterId: 'primary-user',
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws NotFoundException when new owner user not found', async () => {
    const animal = makeAnimal('primary-user')
    animalRepo.findById.mockResolvedValue(animal)
    userRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        newOwnerId: 'ghost-user',
        requesterId: 'primary-user',
      }),
    ).rejects.toThrow(NotFoundException)

    expect(animalRepo.save).not.toHaveBeenCalled()
  })
})
