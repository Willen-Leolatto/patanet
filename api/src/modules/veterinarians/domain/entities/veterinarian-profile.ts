import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export enum VeterinarianVerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface VeterinarianProfileProps {
  userId: string
  crmv: string
  uf: string
  status: VeterinarianVerificationStatus
  documentUrls: string[] | null
  createdAt: Date
  updatedAt: Date
}

export class VeterinarianProfile extends Entity<VeterinarianProfileProps> {
  get userId() {
    return this.props.userId
  }
  get crmv() {
    return this.props.crmv
  }
  get uf() {
    return this.props.uf
  }
  get status() {
    return this.props.status
  }
  get documentUrls() {
    return this.props.documentUrls
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  updateStatus(status: VeterinarianVerificationStatus): void {
    this.props.status = status
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<
      VeterinarianProfileProps,
      'status' | 'createdAt' | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): VeterinarianProfile {
    return new VeterinarianProfile(
      {
        ...props,
        status: VeterinarianVerificationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(
    props: VeterinarianProfileProps,
    id: UniqueEntityID,
  ): VeterinarianProfile {
    return new VeterinarianProfile(props, id)
  }
}
