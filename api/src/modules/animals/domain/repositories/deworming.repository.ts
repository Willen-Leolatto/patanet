import { Deworming } from '../entities/deworming'

export abstract class DewormingRepository {
  abstract findById(id: string): Promise<Deworming | null>
  abstract findByAnimal(animalId: string): Promise<Deworming[]>
  abstract save(deworming: Deworming): Promise<void>
  abstract delete(id: string): Promise<void>
}
