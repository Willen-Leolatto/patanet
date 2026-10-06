import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { VeterinarianAuthorization } from '@modules/veterinarians/domain/entities/veterinarian-authorization'
import { VeterinarianAuthorization as PrismaVeterinarianAuthorization } from '@prisma/client'

export class VeterinarianAuthorizationMapper {
  static toDomain(
    row: PrismaVeterinarianAuthorization,
  ): VeterinarianAuthorization {
    return VeterinarianAuthorization.reconstitute(
      {
        animalId: row.animalId,
        veterinarianId: row.veterinarianId,
        authorizedById: row.authorizedById,
        createdAt: row.createdAt,
        revokedAt: row.revokedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: VeterinarianAuthorization) {
    return {
      id: domain.id.toValue(),
      animalId: domain.animalId,
      veterinarianId: domain.veterinarianId,
      authorizedById: domain.authorizedById,
      createdAt: domain.createdAt,
      revokedAt: domain.revokedAt,
    }
  }
}
