import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  SupportTicket,
  TicketStatus,
} from '../../domain/entities/support-ticket'
import { SupportTicketRepository } from '../../domain/repositories/support-ticket.repository'

export interface UpdateTicketStatusInput {
  ticketId: string
  status: TicketStatus
}

@Injectable()
export class UpdateTicketStatusUseCase {
  constructor(private readonly ticketRepository: SupportTicketRepository) {}

  async execute(input: UpdateTicketStatusInput): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findById(input.ticketId)
    if (!ticket) throw new NotFoundException('Ticket not found')
    if (!ticket.canTransitionTo(input.status)) {
      throw new BadRequestException(
        `Não é possível mudar o status de ${ticket.status} para ${input.status}`,
      )
    }
    ticket.updateStatus(input.status)
    await this.ticketRepository.save(ticket)
    return ticket
  }
}
