import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PetshopRepository } from '@modules/petshops/domain/repositories/petshop.repository'
import {
  AdoptionRequest,
  AdoptionRequestStatus,
} from '../../domain/entities/adoption-request'
import { AdoptionRequestRepository } from '../../domain/repositories/adoption-request.repository'

export interface RejectAdoptionRequestInput {
  adoptionRequestId: string
  requesterId: string
}

@Injectable()
export class RejectAdoptionRequestUseCase {
  constructor(
    private readonly adoptionRequestRepository: AdoptionRequestRepository,
    private readonly petshopRepository: PetshopRepository,
  ) {}

  async execute(input: RejectAdoptionRequestInput): Promise<AdoptionRequest> {
    const request = await this.adoptionRequestRepository.findById(
      input.adoptionRequestId,
    )
    if (!request) throw new NotFoundException('Adoption request not found')

    const petshop = await this.petshopRepository.findById(request.petshopId)
    if (!petshop || petshop.ownerUserId !== input.requesterId) {
      throw new ForbiddenException(
        'Apenas a petshop responsavel pode recusar esta candidatura',
      )
    }

    request.updateStatus(AdoptionRequestStatus.REJECTED)
    await this.adoptionRequestRepository.save(request)
    return request
  }
}
