import { Injectable } from '@nestjs/common'
import { Breed } from '../../domain/entities/breed'
import { BreedRepository } from '../../domain/repositories/breed.repository'

export interface GetBreedsInput {
  query?: string
  specieId?: string
  page: number
  perPage: number
}

@Injectable()
export class GetBreedsUseCase {
  constructor(private readonly breedRepository: BreedRepository) {}

  async execute(
    input: GetBreedsInput,
  ): Promise<{ items: Breed[]; total: number }> {
    return this.breedRepository.findMany({
      query: input.query,
      specieId: input.specieId,
      page: input.page,
      perPage: input.perPage,
    })
  }
}
