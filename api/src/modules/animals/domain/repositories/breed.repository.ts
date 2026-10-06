import { Breed } from '../entities/breed'

export abstract class BreedRepository {
  abstract findById(id: string): Promise<Breed | null>
  abstract findMany(params: {
    query?: string
    specieId?: string
    page: number
    perPage: number
  }): Promise<{ items: Breed[]; total: number }>
}
