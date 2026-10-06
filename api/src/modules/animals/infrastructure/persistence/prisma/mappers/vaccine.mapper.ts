import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Vaccine } from '@modules/animals/domain/entities/vaccine'
import { Vaccine as PrismaVaccine } from '@prisma/client'

export class VaccineMapper {
  static toDomain(row: PrismaVaccine): Vaccine {
    return Vaccine.reconstitute(
      {
        name: row.name,
        observations: row.observations,
        clinic: row.clinic,
        appliedAt: row.appliedAt,
        nextDose: row.nextDose,
        animalId: row.animalId,
        isOfficial: row.isOfficial,
        batchNumber: row.batchNumber,
        manufacturer: row.manufacturer,
        veterinarianId: row.veterinarianId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Vaccine) {
    return {
      id: domain.id.toValue(),
      name: domain.name,
      observations: domain.observations,
      clinic: domain.clinic,
      appliedAt: domain.appliedAt,
      nextDose: domain.nextDose,
      animalId: domain.animalId,
      isOfficial: domain.isOfficial,
      batchNumber: domain.batchNumber,
      manufacturer: domain.manufacturer,
      veterinarianId: domain.veterinarianId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
