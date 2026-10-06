import { MedicalRecord } from '../entities/medical-record'

export abstract class MedicalRecordRepository {
  abstract findById(id: string): Promise<MedicalRecord | null>
  abstract findByAnimalId(animalId: string): Promise<MedicalRecord[]>
  abstract save(record: MedicalRecord): Promise<void>
}
