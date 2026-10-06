import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Medication } from '@modules/animals/domain/entities/medication'
import { MedicationRepository } from '@modules/animals/domain/repositories/medication.repository'
import { MedicationMapper } from '../mappers/medication.mapper'

@Injectable()
export class PrismaMedicationRepository implements MedicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Medication | null> {
    const row = await this.prisma.medication.findUnique({ where: { id } })
    return row ? MedicationMapper.toDomain(row) : null
  }

  async findByAnimal(animalId: string): Promise<Medication[]> {
    const rows = await this.prisma.medication.findMany({
      where: { animalId },
      orderBy: [{ startAt: 'desc' }, { createdAt: 'desc' }],
    })
    return rows.map(row => MedicationMapper.toDomain(row))
  }

  async save(medication: Medication): Promise<void> {
    const data = MedicationMapper.toPersistence(medication)
    const exists = await this.prisma.medication.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.medication.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.medication.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.medication.deleteMany({ where: { id } })
  }
}
