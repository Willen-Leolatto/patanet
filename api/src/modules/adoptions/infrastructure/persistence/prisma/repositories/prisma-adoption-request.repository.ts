import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { AdoptionRequest } from '@modules/adoptions/domain/entities/adoption-request'
import { AdoptionRequestRepository } from '@modules/adoptions/domain/repositories/adoption-request.repository'
import { AdoptionRequestMapper } from '../mappers/adoption-request.mapper'

@Injectable()
export class PrismaAdoptionRequestRepository
  implements AdoptionRequestRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AdoptionRequest | null> {
    const row = await this.prisma.adoptionRequest.findUnique({ where: { id } })
    return row ? AdoptionRequestMapper.toDomain(row) : null
  }

  async findByAnimalId(animalId: string): Promise<AdoptionRequest[]> {
    const rows = await this.prisma.adoptionRequest.findMany({
      where: { animalId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(row => AdoptionRequestMapper.toDomain(row))
  }

  async save(request: AdoptionRequest): Promise<void> {
    const data = AdoptionRequestMapper.toPersistence(request)
    const exists = await this.prisma.adoptionRequest.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.adoptionRequest.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.adoptionRequest.create({ data })
    }
  }
}
