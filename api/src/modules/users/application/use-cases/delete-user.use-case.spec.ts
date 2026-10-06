import { NotFoundException } from '@nestjs/common'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { Animal } from '@modules/animals/domain/entities/animal'
import { OwnerIdList } from '@modules/animals/domain/watched-list/owner-id-list'
import { DeleteUserUseCase } from './delete-user.use-case'

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

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  findAllTutoredBy: jest.fn(),
  findAdoptable: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

function makeUser() {
  return User.reconstitute(
    {
      name: 'Test User',
      displayName: null,
      about: null,
      image: null,
      imageCover: null,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed',
      googleId: null,
      role: 'USER' as any,
      isActive: true,
      deletedAt: null,
      termsAcceptedAt: null,
      termsVersion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('user-1'),
  )
}

function makeAnimal(ownerIds: string[], ownerId: string | null, id: string) {
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
      createdByOwnerId: ownerIds[0] ?? null,
      ownerIds: new OwnerIdList(ownerIds),
      adoptionEventId: null,
      isForAdoption: false,
      petshopId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase
  let userRepo: jest.Mocked<UserRepository>
  let animalRepo: jest.Mocked<AnimalRepository>

  beforeEach(() => {
    userRepo = mockUserRepo()
    animalRepo = mockAnimalRepo()
    useCase = new DeleteUserUseCase(userRepo, animalRepo)
  })

  it('purges the user (LGPD/Play Store) instead of soft-deleting', async () => {
    const user = makeUser()
    userRepo.findById.mockResolvedValue(user)
    animalRepo.findAllTutoredBy.mockResolvedValue([])

    await useCase.execute({ id: 'user-1' })

    expect(userRepo.delete).not.toHaveBeenCalled()
    expect(userRepo.save).not.toHaveBeenCalled()
    expect(userRepo.purge).toHaveBeenCalledWith('user-1')
  })

  it('makes the pet ownerless (not deleted) when the user is the last tutor', async () => {
    const user = makeUser()
    const animal = makeAnimal(['user-1'], 'user-1', 'animal-1')
    userRepo.findById.mockResolvedValue(user)
    animalRepo.findAllTutoredBy.mockResolvedValue([animal])

    await useCase.execute({ id: 'user-1' })

    expect(animalRepo.delete).not.toHaveBeenCalled()
    expect(animalRepo.save).toHaveBeenCalledWith(animal)
    expect(animal.ownerId).toBeNull()
    expect(animal.ownerIds.getItems()).not.toContain('user-1')
  })

  it('transfers primary tutorship when the user was the primary tutor but others remain', async () => {
    const user = makeUser()
    const animal = makeAnimal(['user-1', 'user-2'], 'user-1', 'animal-1')
    userRepo.findById.mockResolvedValue(user)
    animalRepo.findAllTutoredBy.mockResolvedValue([animal])

    await useCase.execute({ id: 'user-1' })

    expect(animal.ownerId).toBe('user-2')
    expect(animal.ownerIds.getItems()).toEqual(['user-2'])
    expect(animalRepo.save).toHaveBeenCalledWith(animal)
  })

  it('just removes the user from co-tutors when another tutor is already primary', async () => {
    const user = makeUser()
    const animal = makeAnimal(['user-2', 'user-1'], 'user-2', 'animal-1')
    userRepo.findById.mockResolvedValue(user)
    animalRepo.findAllTutoredBy.mockResolvedValue([animal])

    await useCase.execute({ id: 'user-1' })

    expect(animal.ownerId).toBe('user-2')
    expect(animal.ownerIds.getItems()).toEqual(['user-2'])
  })

  it('throws NotFoundException when user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null)

    await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(
      NotFoundException,
    )

    expect(userRepo.save).not.toHaveBeenCalled()
    expect(animalRepo.findAllTutoredBy).not.toHaveBeenCalled()
  })
})
