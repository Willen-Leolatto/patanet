import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import {
  VeterinarianProfile,
  VeterinarianVerificationStatus,
} from '@modules/veterinarians/domain/entities/veterinarian-profile'
import { VeterinarianProfile as PrismaVeterinarianProfile, Prisma } from '@prisma/client'

export class VeterinarianProfileMapper {
  static toDomain(row: PrismaVeterinarianProfile): VeterinarianProfile {
    return VeterinarianProfile.reconstitute(
      {
        userId: row.userId,
        crmv: row.crmv,
        uf: row.uf,
        status: row.status as unknown as VeterinarianVerificationStatus,
        documentUrls: (row.documentUrls as string[] | null) ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: VeterinarianProfile) {
    return {
      id: domain.id.toValue(),
      userId: domain.userId,
      crmv: domain.crmv,
      uf: domain.uf,
      status: domain.status as unknown as PrismaVeterinarianProfile['status'],
      documentUrls: domain.documentUrls ?? Prisma.DbNull,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
