import { BadRequestException, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { AdoptionRequestRepository } from '../../domain/repositories/adoption-request.repository'
import { CreateAdoptionRequestUseCase } from './create-adoption-request.use-case'

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  findAllTutoredBy: jest.fn(),
  findAdoptable: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockRequestRepo = (): jest.Mocked<AdoptionRequestRepository> => ({
  findById: jest.fn(),
  findByAnimalId: jest.fn(),
  save: jest.fn(),
})

describe('CreateAdoptionRequestUseCase', () => {
  let useCase: CreateAdoptionRequestUseCase
  let animalRepo: jest.Mocked<AnimalRepository>
  let requestRepo: jest.Mocked<AdoptionRequestRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    requestRepo = mockRequestRepo()
    useCase = new CreateAdoptionRequestUseCase(requestRepo, animalRepo)
  })

  it('throws NotFoundException when animal does not exist', async () => {
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ animalId: 'animal-1', requesterUserId: 'user-1' }),
    ).rejects.toThrow(NotFoundException)
    expect(requestRepo.save).not.toHaveBeenCalled()
  })

  it('throws BadRequestException when animal is not available for adoption', async () => {
    animalRepo.findById.mockResolvedValue({
      isForAdoption: false,
      petshopId: null,
    } as any)

    await expect(
      useCase.execute({ animalId: 'animal-1', requesterUserId: 'user-1' }),
    ).rejects.toThrow(BadRequestException)
    expect(requestRepo.save).not.toHaveBeenCalled()
  })

  it('creates a PENDING adoption request when animal is available', async () => {
    animalRepo.findById.mockResolvedValue({
      isForAdoption: true,
      petshopId: 'petshop-1',
    } as any)
    requestRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      animalId: 'animal-1',
      requesterUserId: 'user-1',
      message: 'Adoro cachorros',
    })

    expect(result.animalId).toBe('animal-1')
    expect(result.requesterUserId).toBe('user-1')
    expect(result.petshopId).toBe('petshop-1')
    expect(result.message).toBe('Adoro cachorros')
    expect(requestRepo.save).toHaveBeenCalledTimes(1)
  })
})
