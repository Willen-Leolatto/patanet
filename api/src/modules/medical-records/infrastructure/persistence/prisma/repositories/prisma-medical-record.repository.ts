import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { MedicalRecord } from '@modules/medical-records/domain/entities/medical-record'
import { MedicalRecordRepository } from '@modules/medical-records/domain/repositories/medical-record.repository'
import { MedicalRecordMapper } from '../mappers/medical-record.mapper'

@Injectable()
export class PrismaMedicalRecordRepository implements MedicalRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MedicalRecord | null> {
    const row = await this.prisma.medicalRecord.findUnique({ where: { id } })
    return row ? MedicalRecordMapper.toDomain(row) : null
  }

  async findByAnimalId(animalId: string): Promise<MedicalRecord[]> {
    const rows = await this.prisma.medicalRecord.findMany({
      where: { animalId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(row => MedicalRecordMapper.toDomain(row))
  }

  async save(record: MedicalRecord): Promise<void> {
    const data = MedicalRecordMapper.toPersistence(record)
    const exists = await this.prisma.medicalRecord.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.medicalRecord.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.medicalRecord.create({ data })
    }
  }
}
