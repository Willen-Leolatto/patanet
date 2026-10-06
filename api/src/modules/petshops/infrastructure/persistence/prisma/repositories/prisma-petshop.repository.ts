import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Petshop } from '@modules/petshops/domain/entities/petshop'
import { PetshopRepository } from '@modules/petshops/domain/repositories/petshop.repository'
import { PetshopMapper } from '../mappers/petshop.mapper'

@Injectable()
export class PrismaPetshopRepository implements PetshopRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Petshop | null> {
    const row = await this.prisma.petshop.findUnique({ where: { id } })
    return row ? PetshopMapper.toDomain(row) : null
  }

  async findByOwnerUserId(ownerUserId: string): Promise<Petshop[]> {
    const rows = await this.prisma.petshop.findMany({ where: { ownerUserId } })
    return rows.map(row => PetshopMapper.toDomain(row))
  }

  async findByCnpj(cnpj: string): Promise<Petshop | null> {
    const row = await this.prisma.petshop.findUnique({ where: { cnpj } })
    return row ? PetshopMapper.toDomain(row) : null
  }

  async save(petshop: Petshop): Promise<void> {
    const data = PetshopMapper.toPersistence(petshop)
    const exists = await this.prisma.petshop.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.petshop.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.petshop.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.petshop.deleteMany({ where: { id } })
  }
}
