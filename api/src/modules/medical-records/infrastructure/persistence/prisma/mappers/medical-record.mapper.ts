import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { MedicalRecord } from '@modules/medical-records/domain/entities/medical-record'
import { MedicalRecord as PrismaMedicalRecord, Prisma } from '@prisma/client'

export class MedicalRecordMapper {
  static toDomain(row: PrismaMedicalRecord): MedicalRecord {
    return MedicalRecord.reconstitute(
      {
        animalId: row.animalId,
        veterinarianId: row.veterinarianId,
        notes: row.notes,
        examRequestUrls: (row.examRequestUrls as string[] | null) ?? null,
        signedAt: row.signedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: MedicalRecord) {
    return {
      id: domain.id.toValue(),
      animalId: domain.animalId,
      veterinarianId: domain.veterinarianId,
      notes: domain.notes,
      examRequestUrls: domain.examRequestUrls ?? Prisma.DbNull,
      signedAt: domain.signedAt,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
