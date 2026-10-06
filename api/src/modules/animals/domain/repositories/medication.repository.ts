import { Medication } from '../entities/medication'

export abstract class MedicationRepository {
  abstract findById(id: string): Promise<Medication | null>
  abstract findByAnimal(animalId: string): Promise<Medication[]>
  abstract save(medication: Medication): Promise<void>
  abstract delete(id: string): Promise<void>
}
