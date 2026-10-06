import { NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { AnimalMediaRepository } from '../../domain/repositories/animal-media.repository'
import { DeleteAnimalMediaUseCase } from './delete-animal-media.use-case'
import { Animal } from '../../domain/entities/animal'
import { AnimalMedia, MediaType } from '../../domain/entities/animal-media'
import { OwnerIdList } from '../../domain/watched-list/owner-id-list'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockAnimalMediaRepo = (): jest.Mocked<AnimalMediaRepository> => ({
  findById: jest.fn(),
  findByAnimal: jest.fn(),
  countByAnimal: jest.fn(),
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

function makeMedia(animalId: string): AnimalMedia {
  return AnimalMedia.reconstitute(
    {
      text: null,
      path: 'https://cdn/img.jpg',
      type: MediaType.IMAGE,
      animalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('media-1'),
  )
}

describe('DeleteAnimalMediaUseCase', () => {
  let useCase: DeleteAnimalMediaUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let mediaRepo: jest.Mocked<AnimalMediaRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    mediaRepo = mockAnimalMediaRepo()
    useCase = new DeleteAnimalMediaUseCase(mediaRepo, animalRepo)
  })

  it('deletes media on happy path', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    mediaRepo.findById.mockResolvedValue(makeMedia('animal-1'))
    mediaRepo.delete.mockResolvedValue(undefined)

    await useCase.execute({
      animalId: 'animal-1',
      mediaId: 'media-1',
      requesterId: 'user-1',
    })

    expect(mediaRepo.delete).toHaveBeenCalledWith('media-1')
  })

  it('throws NotFoundException when animal not found', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        mediaId: 'media-1',
        requesterId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(mediaRepo.delete).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when media not found', async () => {
    animalRepo.findById.mockResolvedValue(makeAnimal('user-1'))
    mediaRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        animalId: 'animal-1',
        mediaId: 'media-1',
        requesterId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException)
    expect(mediaRepo.delete).not.toHaveBeenCalled()
  })
})
