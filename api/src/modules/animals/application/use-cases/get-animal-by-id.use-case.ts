import { Injectable, NotFoundException } from '@nestjs/common'
import { Animal } from '../../domain/entities/animal'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface GetAnimalByIdInput {
  id: string
}

@Injectable()
export class GetAnimalByIdUseCase {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(input: GetAnimalByIdInput): Promise<Animal> {
    const animal = await this.animalRepository.findById(input.id)
    if (!animal) throw new NotFoundException('Animal not found')
    return animal
  }
}
