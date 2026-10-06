import { BadRequestException, Injectable } from '@nestjs/common'
import {
  SupportTicket,
  TicketCategory,
} from '../../domain/entities/support-ticket'
import { SupportTicketMessage } from '../../domain/entities/support-ticket-message'
import { SupportTicketRepository } from '../../domain/repositories/support-ticket.repository'
import { SupportTicketMessageRepository } from '../../domain/repositories/support-ticket-message.repository'

export interface CreateTicketInput {
  authorId: string
  category: TicketCategory
  subject: string
  message: string
  attachments?: string[] | null
}

@Injectable()
export class CreateTicketUseCase {
  constructor(
    private readonly ticketRepository: SupportTicketRepository,
    private readonly messageRepository: SupportTicketMessageRepository,
  ) {}

  async execute(input: CreateTicketInput): Promise<SupportTicket> {
    if (input.subject.length > 120) {
      throw new BadRequestException('Subject must not exceed 120 characters')
    }
    const ticket = SupportTicket.create({
      authorId: input.authorId,
      category: input.category,
      subject: input.subject,
    })
    await this.ticketRepository.save(ticket)
    const message = SupportTicketMessage.create({
      ticketId: ticket.id.toValue(),
      authorId: input.authorId,
      message: input.message,
      attachments: input.attachments ?? null,
    })
    await this.messageRepository.save(message)
    return ticket
  }
}
