import { Petshop } from '../../domain/entities/petshop'

export class ResponsePetshopDto {
  readonly id: string
  readonly ownerUserId: string
  readonly cnpj: string
  readonly businessName: string
  readonly alvaraUrl: string | null
  readonly responsavelTecnicoNome: string | null
  readonly status: string
  readonly addressLine: string | null
  readonly addressCity: string | null
  readonly addressState: string | null
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(petshop: Petshop) {
    this.id = petshop.id.toValue()
    this.ownerUserId = petshop.ownerUserId
    this.cnpj = petshop.cnpj
    this.businessName = petshop.businessName
    this.alvaraUrl = petshop.alvaraUrl
    this.responsavelTecnicoNome = petshop.responsavelTecnicoNome
    this.status = petshop.status
    this.addressLine = petshop.addressLine
    this.addressCity = petshop.addressCity
    this.addressState = petshop.addressState
    this.createdAt = petshop.createdAt
    this.updatedAt = petshop.updatedAt
  }
}
