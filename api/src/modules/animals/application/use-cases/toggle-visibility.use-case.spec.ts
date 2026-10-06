import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { AnimalVisibilityRepository } from '../../domain/repositories/animal-visibility.repository'
import { ToggleVisibilityUseCase } from './toggle-visibility.use-case'
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

const mockVisibilityRepo = (): jest.Mocked<AnimalVisibilityRepository> => ({
  findHiddenIdsByUser: jest.fn(),
  upsert: jest.fn(),
})

function makeAnimal(ownerIds: string[]): Animal {
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
      ownerId: ownerIds[0] ?? null,
      createdByOwnerId: ownerIds[0] ?? null,
      ownerIds: new OwnerIdList(ownerIds),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('animal-1'),
  )
}

describe('ToggleVisibilityUseCase', () => {
  let useCase: ToggleVisibilityUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let visibilityRepo: jest.Mocked<AnimalVisibilityRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    visibilityRepo = mockVisibilityRepo()
    useCase = new ToggleVisibilityUseCase(animalRepo, visibilityRepo)
  })

  it('toggles visibility on happy path', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal(['owner-1']))
    visibilityRepo.upsert.mockResolvedValue(undefined)

    await useCase.execute({
      animalId: 'animal-1',
      userId: 'owner-1',
      hidden: true,
    })

    expect(visibilityRepo.upsert).toHaveBeenCalledWith(
      'animal-1',
      'owner-1',
      true,
    )
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        userId: 'owner-1',
        hidden: true,
      }),
    ).rejects.toThrow(NotFoundException)

    expect(visibilityRepo.upsert).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when user is not an owner', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal(['owner-1']))

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        userId: 'other-user',
        hidden: true,
      }),
    ).rejects.toThrow(NotFoundException)

    expect(visibilityRepo.upsert).not.toHaveBeenCalled()
  })
})
