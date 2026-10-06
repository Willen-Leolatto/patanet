import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import {
  SupportTicket,
  TicketCategory,
  TicketStatus,
} from '@modules/support/domain/entities/support-ticket'
import { SupportTicket as PrismaSupportTicket } from '@prisma/client'

export class SupportTicketMapper {
  static toDomain(row: PrismaSupportTicket): SupportTicket {
    return SupportTicket.reconstitute(
      {
        authorId: row.userId,
        category: row.category as unknown as TicketCategory,
        subject: row.subject,
        status: row.status as unknown as TicketStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: SupportTicket) {
    return {
      id: domain.id.toValue(),
      userId: domain.authorId,
      category: domain.category as unknown as PrismaSupportTicket['category'],
      subject: domain.subject,
      status: domain.status as unknown as PrismaSupportTicket['status'],
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
