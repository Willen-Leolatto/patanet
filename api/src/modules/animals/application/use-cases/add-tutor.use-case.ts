import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { TutorManagementDomainService } from '../../domain/services/tutor-management.domain-service'

export interface AddTutorInput {
  animalId: string
  newOwnerId: string
  requesterId: string
}

@Injectable()
export class AddTutorUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly userRepository: UserRepository,
    private readonly tutorService: TutorManagementDomainService,
  ) {}

  async execute(input: AddTutorInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    if (!this.tutorService.canAddTutor(animal, input.requesterId)) {
      throw new ForbiddenException('Only primary tutor can add owners')
    }

    const user = await this.userRepository.findById(input.newOwnerId)
    if (!user) throw new NotFoundException('User not found')

    if (!animal.ownerIds.exists(input.newOwnerId)) {
      animal.addOwner(input.newOwnerId)
      await this.animalRepository.save(animal)
    }
  }
}
