import { Injectable, NotFoundException } from '@nestjs/common'
import { SupportTicketMessage } from '../../domain/entities/support-ticket-message'
import { SupportTicketRepository } from '../../domain/repositories/support-ticket.repository'
import { SupportTicketMessageRepository } from '../../domain/repositories/support-ticket-message.repository'

export interface SendMessageInput {
  authorId: string
  ticketId: string
  message: string
  attachments?: string[] | null
}

@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly ticketRepository: SupportTicketRepository,
    private readonly messageRepository: SupportTicketMessageRepository,
  ) {}

  async execute(input: SendMessageInput): Promise<void> {
    const ticket = await this.ticketRepository.findById(input.ticketId)
    if (!ticket) throw new NotFoundException('Ticket not found')
    if (ticket.authorId !== input.authorId)
      throw new NotFoundException('Ticket not found')
    const message = SupportTicketMessage.create({
      ticketId: input.ticketId,
      authorId: input.authorId,
      message: input.message,
      attachments: input.attachments ?? null,
    })
    await this.messageRepository.save(message)
    ticket.bumpUpdatedAt()
    await this.ticketRepository.save(ticket)
  }
}
