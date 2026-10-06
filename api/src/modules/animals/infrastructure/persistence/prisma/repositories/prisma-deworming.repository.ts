import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Deworming } from '@modules/animals/domain/entities/deworming'
import { DewormingRepository } from '@modules/animals/domain/repositories/deworming.repository'
import { DewormingMapper } from '../mappers/deworming.mapper'

@Injectable()
export class PrismaDewormingRepository implements DewormingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Deworming | null> {
    const row = await this.prisma.deworming.findUnique({ where: { id } })
    return row ? DewormingMapper.toDomain(row) : null
  }

  async findByAnimal(animalId: string): Promise<Deworming[]> {
    const rows = await this.prisma.deworming.findMany({
      where: { animalId },
      orderBy: [{ appliedAt: 'desc' }, { createdAt: 'desc' }],
    })
    return rows.map(row => DewormingMapper.toDomain(row))
  }

  async save(deworming: Deworming): Promise<void> {
    const data = DewormingMapper.toPersistence(deworming)
    const exists = await this.prisma.deworming.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.deworming.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.deworming.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.deworming.deleteMany({ where: { id } })
  }
}
