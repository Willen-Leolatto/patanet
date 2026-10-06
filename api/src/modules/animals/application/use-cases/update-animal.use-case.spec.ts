import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { StoragePort } from '@shared/application/ports/storage.port'
import { UpdateAnimalUseCase } from './update-animal.use-case'
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

const mockStoragePort = (): jest.Mocked<StoragePort> => ({
  upload: jest.fn(),
  delete: jest.fn(),
})

function makeAnimal(ownerId: string, image: string | null = null): Animal {
  return Animal.reconstitute(
    {
      name: 'Rex',
      about: null,
      image,
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

describe('UpdateAnimalUseCase', () => {
  let useCase: UpdateAnimalUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let storagePort: jest.Mocked<StoragePort>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    storagePort = mockStoragePort()
    useCase = new UpdateAnimalUseCase(animalRepo, storagePort)
  })

  it('updates animal on happy path', async () => {
    const animal = makeAnimal('user-1')
    animalRepo.findById.mockResolvedValue(animal)
    animalRepo.save.mockResolvedValue(undefined)

    await useCase.execute({
      id: 'animal-1',
      requesterId: 'user-1',
      name: 'Max',
    })

    expect(animalRepo.save).toHaveBeenCalledTimes(1)
  })

  it('deletes old image from storage when image changes', async () => {
    const animal = makeAnimal('user-1', 'https://cdn/old.jpg')
    animalRepo.findById.mockResolvedValue(animal)
    storagePort.delete.mockResolvedValue(undefined)
    animalRepo.save.mockResolvedValue(undefined)

    await useCase.execute({
      id: 'animal-1',
      requesterId: 'user-1',
      image: 'https://cdn/new.jpg',
    })

    expect(storagePort.delete).toHaveBeenCalledWith('https://cdn/old.jpg')
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ id: 'animal-1', requesterId: 'user-1', name: 'Max' }),
    ).rejects.toThrow(NotFoundException)
    expect(animalRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when requester is not an owner', async () => {
    const animal = makeAnimal('user-1')
    animalRepo.findById.mockResolvedValue(animal)

    await expect(
      useCase.execute({
        id: 'animal-1',
        requesterId: 'other-user',
        name: 'Max',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(animalRepo.save).not.toHaveBeenCalled()
  })
})
