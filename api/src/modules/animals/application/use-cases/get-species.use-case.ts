import { Injectable } from '@nestjs/common'
import { Specie } from '../../domain/entities/specie'
import { SpecieRepository } from '../../domain/repositories/specie.repository'

export interface GetSpeciesInput {
  query?: string
  page: number
  perPage: number
}

@Injectable()
export class GetSpeciesUseCase {
  constructor(private readonly specieRepository: SpecieRepository) {}

  async execute(
    input: GetSpeciesInput,
  ): Promise<{ items: Specie[]; total: number }> {
    return this.specieRepository.findMany({
      query: input.query,
      page: input.page,
      perPage: input.perPage,
    })
  }
}
