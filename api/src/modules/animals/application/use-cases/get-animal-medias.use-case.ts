import { Injectable } from '@nestjs/common'
import { AnimalMedia } from '../../domain/entities/animal-media'
import { AnimalMediaRepository } from '../../domain/repositories/animal-media.repository'

export interface GetAnimalMediasInput {
  animalId: string
  page: number
  perPage: number
}

@Injectable()
export class GetAnimalMediasUseCase {
  constructor(private readonly animalMediaRepository: AnimalMediaRepository) {}

  async execute(
    input: GetAnimalMediasInput,
  ): Promise<{ items: AnimalMedia[]; total: number }> {
    return this.animalMediaRepository.findByAnimal(input.animalId, {
      page: input.page,
      perPage: input.perPage,
    })
  }
}
