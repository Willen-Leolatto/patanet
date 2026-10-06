import { SupportTicket } from '../entities/support-ticket'

export abstract class SupportTicketRepository {
  abstract findById(id: string): Promise<SupportTicket | null>
  abstract findByAuthor(
    authorId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: SupportTicket[]; total: number }>
  abstract findAll(params: {
    page: number
    perPage: number
  }): Promise<{ items: SupportTicket[]; total: number }>
  abstract save(ticket: SupportTicket): Promise<void>
}
