import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { SupportTicket } from '@modules/support/domain/entities/support-ticket'
import { SupportTicketRepository } from '@modules/support/domain/repositories/support-ticket.repository'
import { SupportTicketMapper } from '../mappers/support-ticket.mapper'

@Injectable()
export class PrismaSupportTicketRepository implements SupportTicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SupportTicket | null> {
    const row = await this.prisma.supportTicket.findUnique({ where: { id } })
    return row ? SupportTicketMapper.toDomain(row) : null
  }

  async findByAuthor(
    authorId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: SupportTicket[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { userId: authorId },
        orderBy: { updatedAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.supportTicket.count({ where: { userId: authorId } }),
    ])
    return { items: rows.map(row => SupportTicketMapper.toDomain(row)), total }
  }

  async findAll(params: {
    page: number
    perPage: number
  }): Promise<{ items: SupportTicket[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        orderBy: { updatedAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.supportTicket.count(),
    ])
    return { items: rows.map(row => SupportTicketMapper.toDomain(row)), total }
  }

  async save(ticket: SupportTicket): Promise<void> {
    const data = SupportTicketMapper.toPersistence(ticket)
    const exists = await this.prisma.supportTicket.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.supportTicket.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.supportTicket.create({ data })
    }
  }
}
