import { SupportTicketMessage } from '../entities/support-ticket-message'

export abstract class SupportTicketMessageRepository {
  abstract findByTicket(ticketId: string): Promise<SupportTicketMessage[]>
  abstract save(message: SupportTicketMessage): Promise<void>
}
