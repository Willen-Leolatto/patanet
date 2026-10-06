import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { SupportTicketMessage } from '@modules/support/domain/entities/support-ticket-message'
import { SupportTicketMessageRepository } from '@modules/support/domain/repositories/support-ticket-message.repository'
import { SupportTicketMessageMapper } from '../mappers/support-ticket-message.mapper'

@Injectable()
export class PrismaSupportTicketMessageRepository
  implements SupportTicketMessageRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findByTicket(ticketId: string): Promise<SupportTicketMessage[]> {
    const rows = await this.prisma.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(row => SupportTicketMessageMapper.toDomain(row))
  }

  async save(message: SupportTicketMessage): Promise<void> {
    const data = SupportTicketMessageMapper.toPersistence(message)
    const exists = await this.prisma.supportTicketMessage.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.supportTicketMessage.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.supportTicketMessage.create({ data })
    }
  }
}
