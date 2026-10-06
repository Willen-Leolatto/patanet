import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Block } from '@modules/blocks/domain/entities/block'
import { BlockRepository } from '@modules/blocks/domain/repositories/block.repository'
import { BlockMapper } from '../mappers/block.mapper'

@Injectable()
export class PrismaBlockRepository implements BlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBlockerAndBlocked(
    blockerId: string,
    blockedId: string,
  ): Promise<Block | null> {
    const row = await this.prisma.block.findFirst({
      where: { blockerId, blockedId },
    })
    return row ? BlockMapper.toDomain(row) : null
  }

  async findByBlocker(
    blockerId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: Block[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.block.findMany({
        where: { blockerId },
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.block.count({ where: { blockerId } }),
    ])
    return { items: rows.map(row => BlockMapper.toDomain(row)), total }
  }

  async save(block: Block): Promise<void> {
    const data = BlockMapper.toPersistence(block)
    const exists = await this.prisma.block.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.block.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.block.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.block.deleteMany({ where: { id } })
  }
}
