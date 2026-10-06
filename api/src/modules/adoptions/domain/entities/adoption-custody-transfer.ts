import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface AdoptionCustodyTransferProps {
  animalId: string
  adoptionRequestId: string
  fromPetshopId: string
  toUserId: string
  transferDocumentUrl: string | null
  transferredAt: Date
}

export class AdoptionCustodyTransfer extends Entity<AdoptionCustodyTransferProps> {
  get animalId() {
    return this.props.animalId
  }
  get adoptionRequestId() {
    return this.props.adoptionRequestId
  }
  get fromPetshopId() {
    return this.props.fromPetshopId
  }
  get toUserId() {
    return this.props.toUserId
  }
  get transferDocumentUrl() {
    return this.props.transferDocumentUrl
  }
  get transferredAt() {
    return this.props.transferredAt
  }

  static create(
    props: Omit<AdoptionCustodyTransferProps, 'transferredAt'>,
    id?: UniqueEntityID,
  ): AdoptionCustodyTransfer {
    return new AdoptionCustodyTransfer(
      { ...props, transferredAt: new Date() },
      id,
    )
  }

  static reconstitute(
    props: AdoptionCustodyTransferProps,
    id: UniqueEntityID,
  ): AdoptionCustodyTransfer {
    return new AdoptionCustodyTransfer(props, id)
  }
}
