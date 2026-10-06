import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import {
  Petshop,
  PetshopVerificationStatus,
} from '@modules/petshops/domain/entities/petshop'
import { Petshop as PrismaPetshop } from '@prisma/client'

export class PetshopMapper {
  static toDomain(row: PrismaPetshop): Petshop {
    return Petshop.reconstitute(
      {
        ownerUserId: row.ownerUserId,
        cnpj: row.cnpj,
        businessName: row.businessName,
        alvaraUrl: row.alvaraUrl,
        responsavelTecnicoNome: row.responsavelTecnicoNome,
        status: row.status as unknown as PetshopVerificationStatus,
        addressLine: row.addressLine,
        addressCity: row.addressCity,
        addressState: row.addressState,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Petshop) {
    return {
      id: domain.id.toValue(),
      ownerUserId: domain.ownerUserId,
      cnpj: domain.cnpj,
      businessName: domain.businessName,
      alvaraUrl: domain.alvaraUrl,
      responsavelTecnicoNome: domain.responsavelTecnicoNome,
      status: domain.status as unknown as PrismaPetshop['status'],
      addressLine: domain.addressLine,
      addressCity: domain.addressCity,
      addressState: domain.addressState,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
