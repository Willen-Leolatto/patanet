import { Injectable } from '@nestjs/common'
import { SupportTicket } from '../../domain/entities/support-ticket'
import { SupportTicketRepository } from '../../domain/repositories/support-ticket.repository'

export interface ListAllTicketsInput {
  page: number
  perPage: number
}

export interface ListAllTicketsOutput {
  items: SupportTicket[]
  total: number
}

@Injectable()
export class ListAllTicketsUseCase {
  constructor(private readonly ticketRepository: SupportTicketRepository) {}

  async execute(input: ListAllTicketsInput): Promise<ListAllTicketsOutput> {
    return this.ticketRepository.findAll({
      page: input.page,
      perPage: input.perPage,
    })
  }
}
