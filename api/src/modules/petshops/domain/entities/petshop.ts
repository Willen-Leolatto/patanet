import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export enum PetshopVerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface PetshopProps {
  ownerUserId: string
  cnpj: string
  businessName: string
  alvaraUrl: string | null
  responsavelTecnicoNome: string | null
  status: PetshopVerificationStatus
  addressLine: string | null
  addressCity: string | null
  addressState: string | null
  createdAt: Date
  updatedAt: Date
}

export class Petshop extends Entity<PetshopProps> {
  get ownerUserId() {
    return this.props.ownerUserId
  }
  get cnpj() {
    return this.props.cnpj
  }
  get businessName() {
    return this.props.businessName
  }
  get alvaraUrl() {
    return this.props.alvaraUrl
  }
  get responsavelTecnicoNome() {
    return this.props.responsavelTecnicoNome
  }
  get status() {
    return this.props.status
  }
  get addressLine() {
    return this.props.addressLine
  }
  get addressCity() {
    return this.props.addressCity
  }
  get addressState() {
    return this.props.addressState
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  updateStatus(status: PetshopVerificationStatus): void {
    this.props.status = status
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<PetshopProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Petshop {
    return new Petshop(
      {
        ...props,
        status: PetshopVerificationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(props: PetshopProps, id: UniqueEntityID): Petshop {
    return new Petshop(props, id)
  }
}
