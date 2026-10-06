import { ConflictException, Injectable } from '@nestjs/common'
import { Petshop } from '../../domain/entities/petshop'
import { PetshopRepository } from '../../domain/repositories/petshop.repository'

export interface ApplyPetshopInput {
  ownerUserId: string
  cnpj: string
  businessName: string
  alvaraUrl: string | null
  responsavelTecnicoNome: string | null
  addressLine?: string | null
  addressCity?: string | null
  addressState?: string | null
}

@Injectable()
export class ApplyPetshopUseCase {
  constructor(private readonly petshopRepository: PetshopRepository) {}

  async execute(input: ApplyPetshopInput): Promise<Petshop> {
    const existing = await this.petshopRepository.findByCnpj(input.cnpj)
    if (existing) {
      throw new ConflictException('Ja existe uma petshop cadastrada com este CNPJ')
    }

    const petshop = Petshop.create({
      ownerUserId: input.ownerUserId,
      cnpj: input.cnpj,
      businessName: input.businessName,
      alvaraUrl: input.alvaraUrl,
      responsavelTecnicoNome: input.responsavelTecnicoNome,
      addressLine: input.addressLine ?? null,
      addressCity: input.addressCity ?? null,
      addressState: input.addressState ?? null,
    })
    await this.petshopRepository.save(petshop)
    return petshop
  }
}
