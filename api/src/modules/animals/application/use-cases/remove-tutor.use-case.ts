import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { TutorManagementDomainService } from '../../domain/services/tutor-management.domain-service'

export interface RemoveTutorInput {
  animalId: string
  ownerId: string
  requesterId: string
}

@Injectable()
export class RemoveTutorUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly tutorService: TutorManagementDomainService,
  ) {}

  async execute(input: RemoveTutorInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const currentOwnerIds = animal.ownerIds.getItems()
    const result = this.tutorService.canRemoveTutor(
      animal,
      input.requesterId,
      input.ownerId,
      currentOwnerIds,
    )

    if (!result.allowed) {
      throw new ForbiddenException(result.reason)
    }

    animal.removeOwner(input.ownerId)
    await this.animalRepository.save(animal)
  }
}
