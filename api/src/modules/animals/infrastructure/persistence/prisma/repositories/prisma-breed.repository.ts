import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Breed } from '@modules/animals/domain/entities/breed'
import { BreedRepository } from '@modules/animals/domain/repositories/breed.repository'
import { BreedMapper } from '../mappers/breed.mapper'

@Injectable()
export class PrismaBreedRepository implements BreedRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Breed | null> {
    const row = await this.prisma.breed.findUnique({ where: { id } })
    return row ? BreedMapper.toDomain(row) : null
  }

  async findMany(params: {
    query?: string
    specieId?: string
    page: number
    perPage: number
  }): Promise<{ items: Breed[]; total: number }> {
    const { query, specieId, page, perPage } = params

    const where = {
      ...(query ? { name: { contains: query, mode: 'insensitive' as const } } : {}),
      ...(specieId ? { specieId } : {}),
    }

    const [rows, total] = await Promise.all([
      this.prisma.breed.findMany({
        where,
        orderBy: { name: 'asc' },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      this.prisma.breed.count({ where }),
    ])

    return { items: rows.map(row => BreedMapper.toDomain(row)), total }
  }
}
