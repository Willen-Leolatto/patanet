import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Medication } from '@modules/animals/domain/entities/medication'
import { Medication as PrismaMedication } from '@prisma/client'

export class MedicationMapper {
  static toDomain(row: PrismaMedication): Medication {
    return Medication.reconstitute(
      {
        name: row.name,
        startAt: row.startAt,
        endAt: row.endAt,
        dosage: row.dosage,
        frequency: row.frequency,
        clinic: row.clinic,
        observations: row.observations,
        animalId: row.animalId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Medication) {
    return {
      id: domain.id.toValue(),
      name: domain.name,
      startAt: domain.startAt,
      endAt: domain.endAt,
      dosage: domain.dosage,
      frequency: domain.frequency,
      clinic: domain.clinic,
      observations: domain.observations,
      animalId: domain.animalId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
