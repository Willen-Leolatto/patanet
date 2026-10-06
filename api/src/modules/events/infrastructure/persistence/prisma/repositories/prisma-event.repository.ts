import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Event } from '@modules/events/domain/entities/event'
import { EventRepository } from '@modules/events/domain/repositories/event.repository'
import { EventMapper } from '../mappers/event.mapper'

@Injectable()
export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Event | null> {
    const row = await this.prisma.event.findUnique({ where: { id } })
    return row ? EventMapper.toDomain(row) : null
  }

  async findAll(params: {
    page: number
    perPage: number
  }): Promise<{ items: Event[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.event.count(),
    ])
    return { items: rows.map(row => EventMapper.toDomain(row)), total }
  }

  async save(event: Event): Promise<void> {
    const data = EventMapper.toPersistence(event)
    const exists = await this.prisma.event.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.event.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.event.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.event.deleteMany({ where: { id } })
  }

  async trySetPostId(id: string, postId: string): Promise<boolean> {
    const result = await this.prisma.event.updateMany({
      where: { id, postId: null },
      data: { postId },
    })
    return result.count === 1
  }
}
