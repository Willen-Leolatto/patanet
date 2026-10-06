import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { VeterinarianAuthorization } from '@modules/veterinarians/domain/entities/veterinarian-authorization'
import { VeterinarianAuthorizationRepository } from '@modules/veterinarians/domain/repositories/veterinarian-authorization.repository'
import { VeterinarianAuthorizationMapper } from '../mappers/veterinarian-authorization.mapper'

@Injectable()
export class PrismaVeterinarianAuthorizationRepository
  implements VeterinarianAuthorizationRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByAnimalAndVet(
    animalId: string,
    veterinarianId: string,
  ): Promise<VeterinarianAuthorization | null> {
    const row = await this.prisma.veterinarianAuthorization.findFirst({
      where: { animalId, veterinarianId, revokedAt: null },
    })
    return row ? VeterinarianAuthorizationMapper.toDomain(row) : null
  }

  async findByAnimalId(
    animalId: string,
  ): Promise<VeterinarianAuthorization[]> {
    const rows = await this.prisma.veterinarianAuthorization.findMany({
      where: { animalId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(row => VeterinarianAuthorizationMapper.toDomain(row))
  }

  async save(authorization: VeterinarianAuthorization): Promise<void> {
    const data = VeterinarianAuthorizationMapper.toPersistence(authorization)
    const exists = await this.prisma.veterinarianAuthorization.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.veterinarianAuthorization.update({
        where: { id: data.id },
        data,
      })
    } else {
      await this.prisma.veterinarianAuthorization.create({ data })
    }
  }
}
