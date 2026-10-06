import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { VeterinarianProfile } from '@modules/veterinarians/domain/entities/veterinarian-profile'
import { VeterinarianProfileRepository } from '@modules/veterinarians/domain/repositories/veterinarian-profile.repository'
import { VeterinarianProfileMapper } from '../mappers/veterinarian-profile.mapper'

@Injectable()
export class PrismaVeterinarianProfileRepository
  implements VeterinarianProfileRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<VeterinarianProfile | null> {
    const row = await this.prisma.veterinarianProfile.findUnique({
      where: { id },
    })
    return row ? VeterinarianProfileMapper.toDomain(row) : null
  }

  async findByUserId(userId: string): Promise<VeterinarianProfile | null> {
    const row = await this.prisma.veterinarianProfile.findUnique({
      where: { userId },
    })
    return row ? VeterinarianProfileMapper.toDomain(row) : null
  }

  async save(profile: VeterinarianProfile): Promise<void> {
    const data = VeterinarianProfileMapper.toPersistence(profile)
    const exists = await this.prisma.veterinarianProfile.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.veterinarianProfile.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.veterinarianProfile.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.veterinarianProfile.deleteMany({ where: { id } })
  }
}
