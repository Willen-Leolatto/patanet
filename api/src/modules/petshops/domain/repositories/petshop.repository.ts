import { Petshop } from '../entities/petshop'

export abstract class PetshopRepository {
  abstract findById(id: string): Promise<Petshop | null>
  abstract findByOwnerUserId(ownerUserId: string): Promise<Petshop[]>
  abstract findByCnpj(cnpj: string): Promise<Petshop | null>
  abstract save(petshop: Petshop): Promise<void>
  abstract delete(id: string): Promise<void>
}
