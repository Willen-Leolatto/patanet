import { Injectable } from '@nestjs/common'
import { Animal } from '../../domain/entities/animal'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface ListAdoptableAnimalsInput {
  eventId?: string
  page: number
  perPage: number
}

export interface ListAdoptableAnimalsOutput {
  items: Animal[]
  total: number
}

@Injectable()
export class ListAdoptableAnimalsUseCase {
  constructor(private readonly animalRepository: AnimalRepository) {}

  async execute(
    input: ListAdoptableAnimalsInput,
  ): Promise<ListAdoptableAnimalsOutput> {
    return this.animalRepository.findAdoptable(input)
  }
}
