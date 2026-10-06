import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { AdoptionRequest } from '../../domain/entities/adoption-request'
import { AdoptionRequestRepository } from '../../domain/repositories/adoption-request.repository'

export interface CreateAdoptionRequestInput {
  animalId: string
  requesterUserId: string
  message?: string | null
}

@Injectable()
export class CreateAdoptionRequestUseCase {
  constructor(
    private readonly adoptionRequestRepository: AdoptionRequestRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: CreateAdoptionRequestInput): Promise<AdoptionRequest> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal) throw new NotFoundException('Animal not found')
    if (!animal.isForAdoption || !animal.petshopId) {
      throw new BadRequestException(
        'Este pet nao esta disponivel para adocao responsavel',
      )
    }

    const request = AdoptionRequest.create({
      animalId: input.animalId,
      requesterUserId: input.requesterUserId,
      petshopId: animal.petshopId,
      message: input.message ?? null,
    })
    await this.adoptionRequestRepository.save(request)
    return request
  }
}
