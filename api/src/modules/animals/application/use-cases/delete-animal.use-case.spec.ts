import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { DeleteAnimalUseCase } from './delete-animal.use-case'
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

describe('DeleteAnimalUseCase', () => {
  let useCase: DeleteAnimalUseCase
  let animalRepo: jest.Mocked<AnimalRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    useCase = new DeleteAnimalUseCase(animalRepo)
  })

  it('deletes animal when requester is owner', async () => {
    const animal = makeAnimal('user-1')
    animalRepo.findById.mockResolvedValue(animal)
    animalRepo.delete.mockResolvedValue(undefined)

    await useCase.execute({ id: 'animal-1', requesterId: 'user-1' })

    expect(animalRepo.delete).toHaveBeenCalledWith('animal-1')
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ id: 'animal-1', requesterId: 'user-1' }),
    ).rejects.toThrow(NotFoundException)
    expect(animalRepo.delete).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when requester is not an owner', async () => {
    const animal = makeAnimal('user-1')
    animalRepo.findById.mockResolvedValue(animal)

    await expect(
      useCase.execute({ id: 'animal-1', requesterId: 'other-user' }),
    ).rejects.toThrow(NotFoundException)
    expect(animalRepo.delete).not.toHaveBeenCalled()
  })
})
