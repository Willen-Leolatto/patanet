import { Vaccine } from '../entities/vaccine'

export abstract class VaccineRepository {
  abstract findById(id: string): Promise<Vaccine | null>
  abstract findByAnimal(
    animalId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: Vaccine[]; total: number }>
  abstract save(vaccine: Vaccine): Promise<void>
  abstract delete(id: string): Promise<void>
}
