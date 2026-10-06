import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { AdoptionCustodyTransfer } from '@modules/adoptions/domain/entities/adoption-custody-transfer'
import { AdoptionCustodyTransferRepository } from '@modules/adoptions/domain/repositories/adoption-custody-transfer.repository'
import { AdoptionCustodyTransferMapper } from '../mappers/adoption-custody-transfer.mapper'

@Injectable()
export class PrismaAdoptionCustodyTransferRepository
  implements AdoptionCustodyTransferRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AdoptionCustodyTransfer | null> {
    const row = await this.prisma.adoptionCustodyTransfer.findUnique({
      where: { id },
    })
    return row ? AdoptionCustodyTransferMapper.toDomain(row) : null
  }

  async findByAdoptionRequestId(
    adoptionRequestId: string,
  ): Promise<AdoptionCustodyTransfer | null> {
    const row = await this.prisma.adoptionCustodyTransfer.findUnique({
      where: { adoptionRequestId },
    })
    return row ? AdoptionCustodyTransferMapper.toDomain(row) : null
  }

  async save(transfer: AdoptionCustodyTransfer): Promise<void> {
    const data = AdoptionCustodyTransferMapper.toPersistence(transfer)
    const exists = await this.prisma.adoptionCustodyTransfer.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.adoptionCustodyTransfer.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.adoptionCustodyTransfer.create({ data })
    }
  }
}
