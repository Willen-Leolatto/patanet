import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Specie } from '@modules/animals/domain/entities/specie'
import { SpecieRepository } from '@modules/animals/domain/repositories/specie.repository'
import { SpecieMapper } from '../mappers/specie.mapper'

@Injectable()
export class PrismaSpecieRepository implements SpecieRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    query?: string
    page: number
    perPage: number
  }): Promise<{ items: Specie[]; total: number }> {
    const { query, page, perPage } = params

    const where = query
      ? { name: { contains: query, mode: 'insensitive' as const } }
      : undefined

    const [rows, total] = await Promise.all([
      this.prisma.specie.findMany({
        where,
        orderBy: { name: 'asc' },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      this.prisma.specie.count({ where }),
    ])

    return { items: rows.map(row => SpecieMapper.toDomain(row)), total }
  }
}
