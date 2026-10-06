import { Injectable, NotFoundException } from '@nestjs/common'
import { AnimalMediaRepository } from '../../domain/repositories/animal-media.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface DeleteAnimalMediaInput {
  animalId: string
  mediaId: string
  requesterId: string
}

@Injectable()
export class DeleteAnimalMediaUseCase {
  constructor(
    private readonly animalMediaRepository: AnimalMediaRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: DeleteAnimalMediaInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const media = await this.animalMediaRepository.findById(input.mediaId)
    if (!media || media.animalId !== input.animalId) {
      throw new NotFoundException('Media not found')
    }

    await this.animalMediaRepository.delete(input.mediaId)
  }
}
