import { Injectable, NotFoundException } from '@nestjs/common'
import { AnimalMedia, MediaType } from '../../domain/entities/animal-media'
import { AnimalMediaRepository } from '../../domain/repositories/animal-media.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface AddAnimalMediaInput {
  animalId: string
  requesterId: string
  imageUrl: string
  text?: string
}

@Injectable()
export class AddAnimalMediaUseCase {
  constructor(
    private readonly animalMediaRepository: AnimalMediaRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: AddAnimalMediaInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const media = AnimalMedia.create({
      animalId: input.animalId,
      path: input.imageUrl,
      type: MediaType.IMAGE,
      text: input.text ?? null,
    })

    await this.animalMediaRepository.save(media)
  }
}
