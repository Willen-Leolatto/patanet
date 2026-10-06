import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { AdoptionCustodyTransfer } from '@modules/adoptions/domain/entities/adoption-custody-transfer'
import { AdoptionCustodyTransfer as PrismaAdoptionCustodyTransfer } from '@prisma/client'

export class AdoptionCustodyTransferMapper {
  static toDomain(
    row: PrismaAdoptionCustodyTransfer,
  ): AdoptionCustodyTransfer {
    return AdoptionCustodyTransfer.reconstitute(
      {
        animalId: row.animalId,
        adoptionRequestId: row.adoptionRequestId,
        fromPetshopId: row.fromPetshopId,
        toUserId: row.toUserId,
        transferDocumentUrl: row.transferDocumentUrl,
        transferredAt: row.transferredAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: AdoptionCustodyTransfer) {
    return {
      id: domain.id.toValue(),
      animalId: domain.animalId,
      adoptionRequestId: domain.adoptionRequestId,
      fromPetshopId: domain.fromPetshopId,
      toUserId: domain.toUserId,
      transferDocumentUrl: domain.transferDocumentUrl,
      transferredAt: domain.transferredAt,
    }
  }
}
