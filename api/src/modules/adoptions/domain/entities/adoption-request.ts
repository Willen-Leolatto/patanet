import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export enum AdoptionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface AdoptionRequestProps {
  animalId: string
  requesterUserId: string
  petshopId: string
  status: AdoptionRequestStatus
  message: string | null
  createdAt: Date
  updatedAt: Date
}

export class AdoptionRequest extends Entity<AdoptionRequestProps> {
  get animalId() {
    return this.props.animalId
  }
  get requesterUserId() {
    return this.props.requesterUserId
  }
  get petshopId() {
    return this.props.petshopId
  }
  get status() {
    return this.props.status
  }
  get message() {
    return this.props.message
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  updateStatus(status: AdoptionRequestStatus): void {
    this.props.status = status
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<AdoptionRequestProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): AdoptionRequest {
    return new AdoptionRequest(
      {
        ...props,
        status: AdoptionRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(
    props: AdoptionRequestProps,
    id: UniqueEntityID,
  ): AdoptionRequest {
    return new AdoptionRequest(props, id)
  }
}
