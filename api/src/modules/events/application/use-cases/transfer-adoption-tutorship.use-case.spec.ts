import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { EventRepository } from '../../domain/repositories/event.repository'
import { Event } from '../../domain/entities/event'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { Animal } from '@modules/animals/domain/entities/animal'
import { OwnerIdList } from '@modules/animals/domain/watched-list/owner-id-list'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { User, UserRole } from '@modules/users/domain/entities/user'
import { TransferAdoptionTutorshipUseCase } from './transfer-adoption-tutorship.use-case'

const mockEventRepo = (): jest.Mocked<EventRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  trySetPostId: jest.fn(),
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

const fakeEvent = { authorId: 'institution-1' } as unknown as Event

function makeInstitution() {
  return { role: UserRole.INSTITUTION } as unknown as User
}

function makeAnimal(
  ownerId: string | null,
  adoptionEventId: string | null,
  id = 'animal-1',
) {
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
      adoptionEventId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('TransferAdoptionTutorshipUseCase', () => {
  let useCase: TransferAdoptionTutorshipUseCase
  let eventRepo: jest.Mocked<EventRepository>
  let animalRepo: jest.Mocked<AnimalRepository>
  let userRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    eventRepo = mockEventRepo()
    animalRepo = mockAnimalRepo()
    userRepo = mockUserRepo()
    useCase = new TransferAdoptionTutorshipUseCase(
      eventRepo,
      animalRepo,
      userRepo,
    )
  })

  it('transfers tutorship of an adoption-listed animal to the new owner', async () => {
    eventRepo.findById.mockResolvedValue(fakeEvent)
    userRepo.findById
      .mockResolvedValueOnce(makeInstitution())
      .mockResolvedValueOnce({} as User)
    const animal = makeAnimal(null, 'event-1')
    animalRepo.findById.mockResolvedValue(animal)

    await useCase.execute({
      eventId: 'event-1',
      animalId: 'animal-1',
      newOwnerId: 'adopter-1',
      requesterId: 'institution-1',
    })

    expect(animal.ownerId).toBe('adopter-1')
    expect(animalRepo.save).toHaveBeenCalledWith(animal)
  })

  it('throws ForbiddenException when requester is not the event author', async () => {
    eventRepo.findById.mockResolvedValue(fakeEvent)

    await expect(
      useCase.execute({
        eventId: 'event-1',
        animalId: 'animal-1',
        newOwnerId: 'adopter-1',
        requesterId: 'someone-else',
      }),
    ).rejects.toThrow(ForbiddenException)
  })

  it('throws ForbiddenException when the animal is not listed under this event', async () => {
    eventRepo.findById.mockResolvedValue(fakeEvent)
    userRepo.findById.mockResolvedValue(makeInstitution())
    animalRepo.findById.mockResolvedValue(makeAnimal(null, 'other-event'))

    await expect(
      useCase.execute({
        eventId: 'event-1',
        animalId: 'animal-1',
        newOwnerId: 'adopter-1',
        requesterId: 'institution-1',
      }),
    ).rejects.toThrow(ForbiddenException)

    expect(animalRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when the new owner does not exist', async () => {
    eventRepo.findById.mockResolvedValue(fakeEvent)
    userRepo.findById
      .mockResolvedValueOnce(makeInstitution())
      .mockResolvedValueOnce(null)
    animalRepo.findById.mockResolvedValue(makeAnimal(null, 'event-1'))

    await expect(
      useCase.execute({
        eventId: 'event-1',
        animalId: 'animal-1',
        newOwnerId: 'nonexistent',
        requesterId: 'institution-1',
      }),
    ).rejects.toThrow(NotFoundException)

    expect(animalRepo.save).not.toHaveBeenCalled()
  })
})
