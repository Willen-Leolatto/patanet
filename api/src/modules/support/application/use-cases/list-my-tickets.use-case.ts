import { Injectable } from '@nestjs/common'
import { SupportTicket } from '../../domain/entities/support-ticket'
import { SupportTicketRepository } from '../../domain/repositories/support-ticket.repository'

export interface ListMyTicketsInput {
  authorId: string
  page: number
  perPage: number
}

export interface ListMyTicketsOutput {
  items: SupportTicket[]
  total: number
}

@Injectable()
export class ListMyTicketsUseCase {
  constructor(private readonly ticketRepository: SupportTicketRepository) {}

  async execute(input: ListMyTicketsInput): Promise<ListMyTicketsOutput> {
    return this.ticketRepository.findByAuthor(input.authorId, {
      page: input.page,
      perPage: input.perPage,
    })
  }
}
