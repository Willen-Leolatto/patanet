import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Vaccine } from '@modules/animals/domain/entities/vaccine'
import { VaccineRepository } from '@modules/animals/domain/repositories/vaccine.repository'
import { VaccineMapper } from '../mappers/vaccine.mapper'

@Injectable()
export class PrismaVaccineRepository implements VaccineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Vaccine | null> {
    const row = await this.prisma.vaccine.findUnique({ where: { id } })
    return row ? VaccineMapper.toDomain(row) : null
  }

  async findByAnimal(
    animalId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: Vaccine[]; total: number }> {
    const { page, perPage } = params
    const [rows, total] = await Promise.all([
      this.prisma.vaccine.findMany({
        where: { animalId },
        orderBy: { createdAt: 'desc' },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      this.prisma.vaccine.count({ where: { animalId } }),
    ])
    return { items: rows.map(row => VaccineMapper.toDomain(row)), total }
  }

  async save(vaccine: Vaccine): Promise<void> {
    const data = VaccineMapper.toPersistence(vaccine)
    const exists = await this.prisma.vaccine.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.vaccine.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.vaccine.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vaccine.deleteMany({ where: { id } })
  }
}
