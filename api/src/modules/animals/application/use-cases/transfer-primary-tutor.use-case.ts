import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { TutorManagementDomainService } from '../../domain/services/tutor-management.domain-service'

export interface TransferPrimaryTutorInput {
  animalId: string
  newPrimaryId: string
  requesterId: string
}

@Injectable()
export class TransferPrimaryTutorUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly tutorService: TutorManagementDomainService,
  ) {}

  async execute(input: TransferPrimaryTutorInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    if (!this.tutorService.canTransferOwnership(animal, input.requesterId)) {
      throw new ForbiddenException('Only primary tutor can transfer')
    }

    if (!animal.ownerIds.exists(input.newPrimaryId)) {
      throw new NotFoundException('New primary must be an owner')
    }

    animal.transferPrimary(input.newPrimaryId)
    await this.animalRepository.save(animal)
  }
}
