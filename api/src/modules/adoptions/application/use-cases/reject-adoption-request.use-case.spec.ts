import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { PetshopRepository } from '@modules/petshops/domain/repositories/petshop.repository'
import { AdoptionRequestStatus } from '../../domain/entities/adoption-request'
import { AdoptionRequestRepository } from '../../domain/repositories/adoption-request.repository'
import { RejectAdoptionRequestUseCase } from './reject-adoption-request.use-case'

const mockRequestRepo = (): jest.Mocked<AdoptionRequestRepository> => ({
  findById: jest.fn(),
  findByAnimalId: jest.fn(),
  save: jest.fn(),
})

const mockPetshopRepo = (): jest.Mocked<PetshopRepository> => ({
  findById: jest.fn(),
  findByOwnerUserId: jest.fn(),
  findByCnpj: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

function makeRequest(petshopId = 'petshop-1'): any {
  return {
    petshopId,
    status: AdoptionRequestStatus.PENDING,
    updateStatus: jest.fn(function (this: any, status: AdoptionRequestStatus) {
      this.status = status
    }),
  }
}

describe('RejectAdoptionRequestUseCase', () => {
  let useCase: RejectAdoptionRequestUseCase
  let requestRepo: jest.Mocked<AdoptionRequestRepository>
  let petshopRepo: jest.Mocked<PetshopRepository>

  beforeEach(() => {
    requestRepo = mockRequestRepo()
    petshopRepo = mockPetshopRepo()
    useCase = new RejectAdoptionRequestUseCase(requestRepo, petshopRepo)
  })

  it('throws NotFoundException when adoption request does not exist', async () => {
    requestRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ adoptionRequestId: 'req-1', requesterId: 'user-1' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws ForbiddenException when requester does not own the petshop', async () => {
    requestRepo.findById.mockResolvedValue(makeRequest())
    petshopRepo.findById.mockResolvedValue({ ownerUserId: 'someone-else' } as any)

    await expect(
      useCase.execute({ adoptionRequestId: 'req-1', requesterId: 'user-1' }),
    ).rejects.toThrow(ForbiddenException)
    expect(requestRepo.save).not.toHaveBeenCalled()
  })

  it('marks the request REJECTED when requester owns the petshop', async () => {
    const request = makeRequest()
    requestRepo.findById.mockResolvedValue(request)
    petshopRepo.findById.mockResolvedValue({ ownerUserId: 'user-1' } as any)
    requestRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      adoptionRequestId: 'req-1',
      requesterId: 'user-1',
    })

    expect(result.status).toBe(AdoptionRequestStatus.REJECTED)
    expect(requestRepo.save).toHaveBeenCalledWith(request)
  })
})
