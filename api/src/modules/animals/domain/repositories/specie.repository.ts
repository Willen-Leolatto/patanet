import { Specie } from '../entities/specie'

export abstract class SpecieRepository {
  abstract findMany(params: {
    query?: string
    page: number
    perPage: number
  }): Promise<{ items: Specie[]; total: number }>
}
