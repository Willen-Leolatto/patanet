import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Deworming } from '@modules/animals/domain/entities/deworming'
import { Deworming as PrismaDeworming } from '@prisma/client'

export class DewormingMapper {
  static toDomain(row: PrismaDeworming): Deworming {
    return Deworming.reconstitute(
      {
        name: row.name,
        observations: row.observations,
        clinic: row.clinic,
        appliedAt: row.appliedAt,
        nextDose: row.nextDose,
        animalId: row.animalId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Deworming) {
    return {
      id: domain.id.toValue(),
      name: domain.name,
      observations: domain.observations,
      clinic: domain.clinic,
      appliedAt: domain.appliedAt,
      nextDose: domain.nextDose,
      animalId: domain.animalId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
