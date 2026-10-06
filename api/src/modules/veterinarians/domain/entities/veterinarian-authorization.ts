import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface VeterinarianAuthorizationProps {
  animalId: string
  veterinarianId: string
  authorizedById: string
  createdAt: Date
  revokedAt: Date | null
}

export class VeterinarianAuthorization extends Entity<VeterinarianAuthorizationProps> {
  get animalId() {
    return this.props.animalId
  }
  get veterinarianId() {
    return this.props.veterinarianId
  }
  get authorizedById() {
    return this.props.authorizedById
  }
  get createdAt() {
    return this.props.createdAt
  }
  get revokedAt() {
    return this.props.revokedAt
  }

  get isActive() {
    return this.props.revokedAt === null
  }

  revoke(): void {
    this.props.revokedAt = new Date()
  }

  static create(
    props: Omit<VeterinarianAuthorizationProps, 'createdAt' | 'revokedAt'>,
    id?: UniqueEntityID,
  ): VeterinarianAuthorization {
    return new VeterinarianAuthorization(
      { ...props, createdAt: new Date(), revokedAt: null },
      id,
    )
  }

  static reconstitute(
    props: VeterinarianAuthorizationProps,
    id: UniqueEntityID,
  ): VeterinarianAuthorization {
    return new VeterinarianAuthorization(props, id)
  }
}
