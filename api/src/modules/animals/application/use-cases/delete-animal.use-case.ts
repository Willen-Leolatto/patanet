import { Injectable, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface DeleteAnimalInput {
  id: string
  requesterId: string
}

@Injectable()
export class DeleteAnimalUseCase {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(input: DeleteAnimalInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.id)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }
    await this.animalRepository.delete(input.id)
  }
}
