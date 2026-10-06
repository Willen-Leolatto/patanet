import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { PetshopRepository } from '@modules/petshops/domain/repositories/petshop.repository'
import { StoragePort } from '@shared/application/ports/storage.port'
import { AdoptionRequestStatus } from '../../domain/entities/adoption-request'
import { AdoptionRequestRepository } from '../../domain/repositories/adoption-request.repository'
import { TransferPetCustodyUseCase } from './transfer-pet-custody.use-case'

const mockRequestRepo = (): jest.Mocked<AdoptionRequestRepository> => ({
  findById: jest.fn(),
  findByAnimalId: jest.fn(),
  save: jest.fn(),
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

const mockPetshopRepo = (): jest.Mocked<PetshopRepository> => ({
  findById: jest.fn(),
  findByOwnerUserId: jest.fn(),
  findByCnpj: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

const mockStoragePort = (): jest.Mocked<StoragePort> => ({
  upload: jest.fn(),
  delete: jest.fn(),
})

function mockPrisma() {
  return {
    $transaction: jest.fn().mockResolvedValue(undefined),
    adoptionRequest: { update: jest.fn().mockReturnValue('update-request') },
    adoptionCustodyTransfer: {
      create: jest.fn().mockReturnValue('create-transfer'),
    },
    animal: { update: jest.fn().mockReturnValue('update-animal') },
  } as any
}

function makeRequest(overrides: Partial<Record<string, any>> = {}): any {
  return {
    id: { toValue: () => 'req-1' },
    petshopId: 'petshop-1',
    animalId: 'animal-1',
    requesterUserId: 'adopter-1',
    status: AdoptionRequestStatus.PENDING,
    ...overrides,
  }
}

describe('TransferPetCustodyUseCase', () => {
  let useCase: TransferPetCustodyUseCase
  let prisma: ReturnType<typeof mockPrisma>
  let requestRepo: jest.Mocked<AdoptionRequestRepository>
  let animalRepo: jest.Mocked<AnimalRepository>
  let petshopRepo: jest.Mocked<PetshopRepository>
  let storagePort: jest.Mocked<StoragePort>

  beforeEach(() => {
    prisma = mockPrisma()
    requestRepo = mockRequestRepo()
    animalRepo = mockAnimalRepo()
    petshopRepo = mockPetshopRepo()
    storagePort = mockStoragePort()
    useCase = new TransferPetCustodyUseCase(
      prisma,
      requestRepo,
      animalRepo,
      petshopRepo,
      storagePort,
    )
  })

  it('throws NotFoundException when adoption request does not exist', async () => {
    requestRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ adoptionRequestId: 'req-1', requesterId: 'user-1' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws ForbiddenException when the request was already decided', async () => {
    requestRepo.findById.mockResolvedValue(
      makeRequest({ status: AdoptionRequestStatus.APPROVED }),
    )

    await expect(
      useCase.execute({ adoptionRequestId: 'req-1', requesterId: 'petshop-owner' }),
    ).rejects.toThrow(ForbiddenException)
  })

  it('throws ForbiddenException when requester does not own the petshop', async () => {
    requestRepo.findById.mockResolvedValue(makeRequest())
    petshopRepo.findById.mockResolvedValue({
      id: { toValue: () => 'petshop-1' },
      ownerUserId: 'someone-else',
      businessName: 'Petshop A',
    } as any)

    await expect(
      useCase.execute({ adoptionRequestId: 'req-1', requesterId: 'user-1' }),
    ).rejects.toThrow(ForbiddenException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when the animal no longer exists', async () => {
    requestRepo.findById.mockResolvedValue(makeRequest())
    petshopRepo.findById.mockResolvedValue({
      id: { toValue: () => 'petshop-1' },
      ownerUserId: 'petshop-owner',
      businessName: 'Petshop A',
    } as any)
    animalRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ adoptionRequestId: 'req-1', requesterId: 'petshop-owner' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('uploads the digital adoption term and runs the atomic transfer transaction', async () => {
    const request = makeRequest()
    requestRepo.findById.mockResolvedValue(request)
    petshopRepo.findById.mockResolvedValue({
      id: { toValue: () => 'petshop-1' },
      ownerUserId: 'petshop-owner',
      businessName: 'Petshop A',
    } as any)
    animalRepo.findById.mockResolvedValue({
      id: { toValue: () => 'animal-1' },
      name: 'Rex',
    } as any)
    storagePort.upload.mockResolvedValue({
      url: 'https://storage.test/termo-adocao-req-1.json',
    })

    const result = await useCase.execute({
      adoptionRequestId: 'req-1',
      requesterId: 'petshop-owner',
    })

    expect(storagePort.upload).toHaveBeenCalledTimes(1)
    expect(storagePort.upload.mock.calls[0][0].mimetype).toBe('application/json')
    expect(prisma.adoptionRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { status: 'APPROVED' },
    })
    expect(prisma.animal.update).toHaveBeenCalledWith({
      where: { id: 'animal-1' },
      data: {
        ownerId: 'adopter-1',
        isForAdoption: false,
        petshopId: null,
        owners: { connect: { id: 'adopter-1' } },
      },
    })
    expect(prisma.$transaction).toHaveBeenCalledWith([
      'update-request',
      'create-transfer',
      'update-animal',
    ])
    expect(result.transferDocumentUrl).toBe(
      'https://storage.test/termo-adocao-req-1.json',
    )
    expect(typeof result.adoptionCustodyTransferId).toBe('string')
  })
})
