import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { Animal } from '../../domain/entities/animal'
import { OwnerIdList } from '../../domain/watched-list/owner-id-list'
import { User } from '@modules/users/domain/entities/user'
import { AdoptAnimalUseCase } from './adopt-animal.use-case'

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  findAllTutoredBy: jest.fn(),
  findAdoptable: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockUserRepo = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByIdWithAnimalsCount: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByGoogleId: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  purge: jest.fn(),
})

function makeAnimal(ownerId: string | null, id = 'animal-1') {
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
      createdByOwnerId: null,
      ownerIds: new OwnerIdList(ownerId ? [ownerId] : []),
      adoptionEventId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('AdoptAnimalUseCase', () => {
  let useCase: AdoptAnimalUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let userRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    userRepo = mockUserRepo()
    useCase = new AdoptAnimalUseCase(animalRepo, userRepo)
  })

  it('adopts an ownerless animal', async () => {
    const animal = makeAnimal(null)
    animalRepo.findById.mockResolvedValue(animal)
    userRepo.findById.mockResolvedValue({} as User)

    await useCase.execute({ animalId: 'animal-1', requesterId: 'user-1' })

    expect(animal.ownerId).toBe('user-1')
    expect(animal.ownerIds.getItems()).toContain('user-1')
    expect(animalRepo.save).toHaveBeenCalledWith(animal)
  })

  it('throws NotFoundException when animal does not exist', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ animalId: 'nonexistent', requesterId: 'user-1' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws ForbiddenException when the animal already has an owner', async () => {
    const animal = makeAnimal('user-2')
    animalRepo.findById.mockResolvedValue(animal)

    await expect(
      useCase.execute({ animalId: 'animal-1', requesterId: 'user-1' }),
    ).rejects.toThrow(ForbiddenException)

    expect(animalRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when requester does not exist', async () => {
    const animal = makeAnimal(null)
    animalRepo.findById.mockResolvedValue(animal)
    userRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ animalId: 'animal-1', requesterId: 'user-1' }),
    ).rejects.toThrow(NotFoundException)

    expect(animalRepo.save).not.toHaveBeenCalled()
  })
})
