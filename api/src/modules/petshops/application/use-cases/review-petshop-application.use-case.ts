import { Injectable, NotFoundException } from '@nestjs/common'
import {
  Petshop,
  PetshopVerificationStatus,
} from '../../domain/entities/petshop'
import { PetshopRepository } from '../../domain/repositories/petshop.repository'

export interface ReviewPetshopApplicationInput {
  petshopId: string
  status: PetshopVerificationStatus
}

@Injectable()
export class ReviewPetshopApplicationUseCase {
  constructor(private readonly petshopRepository: PetshopRepository) {}

  async execute(input: ReviewPetshopApplicationInput): Promise<Petshop> {
    const petshop = await this.petshopRepository.findById(input.petshopId)
    if (!petshop) throw new NotFoundException('Petshop not found')

    petshop.updateStatus(input.status)
    await this.petshopRepository.save(petshop)
    return petshop
  }
}
