import { ListAllTicketsUseCase } from './list-all-tickets.use-case'
import { SupportTicketRepository } from '../../domain/repositories/support-ticket.repository'
import {
  SupportTicket,
  TicketCategory,
  TicketStatus,
} from '../../domain/entities/support-ticket'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

const mockTicketRepo = (): jest.Mocked<SupportTicketRepository> =>
  ({
    findById: jest.fn(),
    findByAuthor: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
  }) as unknown as jest.Mocked<SupportTicketRepository>

function makeTicket(authorId: string, id: string): SupportTicket {
  return SupportTicket.reconstitute(
    {
      authorId,
      category: TicketCategory.GENERAL,
      subject: 'Test',
      status: TicketStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('ListAllTicketsUseCase', () => {
  let useCase: ListAllTicketsUseCase
  let ticketRepo: jest.Mocked<SupportTicketRepository>

  beforeEach(() => {
    ticketRepo = mockTicketRepo()
    useCase = new ListAllTicketsUseCase(ticketRepo)
  })

  it('returns all tickets paginated', async () => {
    const tickets = [
      makeTicket('user-1', 'ticket-1'),
      makeTicket('user-2', 'ticket-2'),
      makeTicket('user-3', 'ticket-3'),
    ]
    ticketRepo.findAll.mockResolvedValue({ items: tickets, total: 3 })

    const result = await useCase.execute({ page: 1, perPage: 10 })

    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
    expect(ticketRepo.findAll).toHaveBeenCalledWith({ page: 1, perPage: 10 })
  })

  it('returns empty when no tickets exist', async () => {
    ticketRepo.findAll.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({ page: 1, perPage: 10 })

    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('passes pagination params correctly', async () => {
    ticketRepo.findAll.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ page: 3, perPage: 20 })

    expect(ticketRepo.findAll).toHaveBeenCalledWith({ page: 3, perPage: 20 })
  })
})
