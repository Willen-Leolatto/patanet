import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { SupportTicketMessage } from '@modules/support/domain/entities/support-ticket-message'
import { SupportTicketMessage as PrismaSupportTicketMessage, Prisma } from '@prisma/client'

export class SupportTicketMessageMapper {
  static toDomain(row: PrismaSupportTicketMessage): SupportTicketMessage {
    return SupportTicketMessage.reconstitute(
      {
        ticketId: row.ticketId,
        authorId: row.authorId,
        message: row.message,
        attachments: (row.attachments as string[] | null) ?? null,
        createdAt: row.createdAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: SupportTicketMessage) {
    return {
      id: domain.id.toValue(),
      ticketId: domain.ticketId,
      authorId: domain.authorId,
      message: domain.message,
      attachments: domain.attachments ?? Prisma.DbNull,
      createdAt: domain.createdAt,
    }
  }
}
