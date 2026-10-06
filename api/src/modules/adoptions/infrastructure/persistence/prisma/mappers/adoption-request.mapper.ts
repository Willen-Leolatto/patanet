import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import {
  AdoptionRequest,
  AdoptionRequestStatus,
} from '@modules/adoptions/domain/entities/adoption-request'
import { AdoptionRequest as PrismaAdoptionRequest } from '@prisma/client'

export class AdoptionRequestMapper {
  static toDomain(row: PrismaAdoptionRequest): AdoptionRequest {
    return AdoptionRequest.reconstitute(
      {
        animalId: row.animalId,
        requesterUserId: row.requesterUserId,
        petshopId: row.petshopId,
        status: row.status as unknown as AdoptionRequestStatus,
        message: row.message,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: AdoptionRequest) {
    return {
      id: domain.id.toValue(),
      animalId: domain.animalId,
      requesterUserId: domain.requesterUserId,
      petshopId: domain.petshopId,
      status: domain.status as unknown as PrismaAdoptionRequest['status'],
      message: domain.message,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
