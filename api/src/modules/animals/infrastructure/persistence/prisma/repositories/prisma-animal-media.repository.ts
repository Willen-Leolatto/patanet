import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { AnimalMedia } from '@modules/animals/domain/entities/animal-media'
import { AnimalMediaRepository } from '@modules/animals/domain/repositories/animal-media.repository'
import { AnimalMediaMapper } from '../mappers/animal-media.mapper'

@Injectable()
export class PrismaAnimalMediaRepository implements AnimalMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AnimalMedia | null> {
    const row = await this.prisma.animalMedia.findUnique({ where: { id } })
    return row ? AnimalMediaMapper.toDomain(row) : null
  }

  async findByAnimal(
    animalId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: AnimalMedia[]; total: number }> {
    const { page, perPage } = params
    const [rows, total] = await Promise.all([
      this.prisma.animalMedia.findMany({
        where: { animalId },
        orderBy: { createdAt: 'desc' },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      this.prisma.animalMedia.count({ where: { animalId } }),
    ])
    return { items: rows.map(row => AnimalMediaMapper.toDomain(row)), total }
  }

  async countByAnimal(animalId: string): Promise<number> {
    return this.prisma.animalMedia.count({ where: { animalId } })
  }

  async save(media: AnimalMedia): Promise<void> {
    const data = AnimalMediaMapper.toPersistence(media)
    const exists = await this.prisma.animalMedia.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.animalMedia.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.animalMedia.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.animalMedia.deleteMany({ where: { id } })
  }
}
