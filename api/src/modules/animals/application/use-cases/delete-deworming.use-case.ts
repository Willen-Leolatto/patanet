import { Injectable, NotFoundException } from '@nestjs/common'
import { DewormingRepository } from '../../domain/repositories/deworming.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface DeleteDewormingInput {
  animalId: string
  dewormingId: string
  requesterId: string
}

@Injectable()
export class DeleteDewormingUseCase {
  constructor(
    private readonly dewormingRepository: DewormingRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: DeleteDewormingInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const deworming = await this.dewormingRepository.findById(input.dewormingId)
    if (!deworming || deworming.animalId !== input.animalId) {
      throw new NotFoundException('Deworming not found')
    }

    await this.dewormingRepository.delete(input.dewormingId)
  }
}
