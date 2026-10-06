import { BadRequestException, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { BreedRepository } from '../../domain/repositories/breed.repository'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { PetshopRepository } from '@modules/petshops/domain/repositories/petshop.repository'
import { PetshopVerificationStatus } from '@modules/petshops/domain/entities/petshop'
import { CreateAnimalUseCase } from './create-animal.use-case'

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockBreedRepo = (): jest.Mocked<BreedRepository> => ({
  findById: jest.fn(),
  findMany: jest.fn(),
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

const mockPetshopRepo = (): jest.Mocked<PetshopRepository> => ({
  findById: jest.fn(),
  findByOwnerUserId: jest.fn(),
  findByCnpj: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const baseInput = {
  name: 'Rex',
  weight: 10,
  size: 'MEDIUM',
  gender: 'MALE',
  breedId: 'breed-1',
  requesterId: 'user-1',
}

describe('CreateAnimalUseCase', () => {
  let useCase: CreateAnimalUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let breedRepo: jest.Mocked<BreedRepository>
  let userRepo: jest.Mocked<UserRepository>
  let petshopRepo: jest.Mocked<PetshopRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    breedRepo = mockBreedRepo()
    userRepo = mockUserRepo()
    petshopRepo = mockPetshopRepo()
    useCase = new CreateAnimalUseCase(animalRepo, breedRepo, userRepo, petshopRepo)
  })

  it('creates animal on happy path', async () => {
    userRepo.findById.mockResolvedValue({
      id: { toValue: () => 'user-1' },
    } as any)
    breedRepo.findById.mockResolvedValue({
      id: { toValue: () => 'breed-1' },
    } as any)
    animalRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute(baseInput)

    expect(result.name).toBe('Rex')
    expect(result.ownerId).toBe('user-1')
    expect(result.ownerIds.getItems()).toContain('user-1')
    expect(animalRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws NotFoundException when user not found', async () => {
    userRepo.findById.mockResolvedValue(null)

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException)
    expect(animalRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when breed not found', async () => {
    userRepo.findById.mockResolvedValue({
      id: { toValue: () => 'user-1' },
    } as any)
    breedRepo.findById.mockResolvedValue(null)

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException)
    expect(animalRepo.save).not.toHaveBeenCalled()
  })

  it('creates an ownerless pet under petshop custody when isForAdoption and requester owns an approved petshop', async () => {
    userRepo.findById.mockResolvedValue({
      id: { toValue: () => 'user-1' },
    } as any)
    breedRepo.findById.mockResolvedValue({
      id: { toValue: () => 'breed-1' },
    } as any)
    petshopRepo.findByOwnerUserId.mockResolvedValue([
      {
        id: { toValue: () => 'petshop-1' },
        status: PetshopVerificationStatus.APPROVED,
      } as any,
    ])
    animalRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({ ...baseInput, isForAdoption: true })

    expect(result.ownerId).toBeNull()
    expect(result.isForAdoption).toBe(true)
    expect(result.petshopId).toBe('petshop-1')
    expect(result.ownerIds.getItems()).toHaveLength(0)
  })

  it('throws BadRequestException when isForAdoption but requester has no approved petshop', async () => {
    userRepo.findById.mockResolvedValue({
      id: { toValue: () => 'user-1' },
    } as any)
    breedRepo.findById.mockResolvedValue({
      id: { toValue: () => 'breed-1' },
    } as any)
    petshopRepo.findByOwnerUserId.mockResolvedValue([])

    await expect(
      useCase.execute({ ...baseInput, isForAdoption: true }),
    ).rejects.toThrow(BadRequestException)
    expect(animalRepo.save).not.toHaveBeenCalled()
  })
})
