import { Injectable, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { AnimalVisibilityRepository } from '../../domain/repositories/animal-visibility.repository'

export interface ToggleVisibilityInput {
  animalId: string
  userId: string
  hidden: boolean
}

@Injectable()
export class ToggleVisibilityUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly visibilityRepository: AnimalVisibilityRepository,
  ) {}

  async execute(input: ToggleVisibilityInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.userId)) {
      throw new NotFoundException('Animal not found')
    }

    await this.visibilityRepository.upsert(
      input.animalId,
      input.userId,
      input.hidden,
    )
  }
}
