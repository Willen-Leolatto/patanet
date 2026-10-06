import {
  SupportTicket,
  TicketCategory,
  TicketStatus,
} from '../../domain/entities/support-ticket'

export class ResponseTicketDto {
  id: string
  authorId: string
  category: TicketCategory
  subject: string
  status: TicketStatus
  createdAt: Date
  updatedAt: Date

  constructor(ticket: SupportTicket) {
    this.id = ticket.id.toValue()
    this.authorId = ticket.authorId
    this.category = ticket.category
    this.subject = ticket.subject
    this.status = ticket.status
    this.createdAt = ticket.createdAt
    this.updatedAt = ticket.updatedAt
  }
}
