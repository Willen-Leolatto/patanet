import { ListMyTicketsUseCase } from './list-my-tickets.use-case'
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

describe('ListMyTicketsUseCase', () => {
  let useCase: ListMyTicketsUseCase
  let ticketRepo: jest.Mocked<SupportTicketRepository>

  beforeEach(() => {
    ticketRepo = mockTicketRepo()
    useCase = new ListMyTicketsUseCase(ticketRepo)
  })

  it('returns only tickets belonging to the requesting user', async () => {
    const userTickets = [
      makeTicket('user-1', 'ticket-1'),
      makeTicket('user-1', 'ticket-2'),
    ]
    ticketRepo.findByAuthor.mockResolvedValue({ items: userTickets, total: 2 })

    const result = await useCase.execute({
      authorId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
    result.items.forEach(t => expect(t.authorId).toBe('user-1'))
    expect(ticketRepo.findByAuthor).toHaveBeenCalledWith('user-1', {
      page: 1,
      perPage: 10,
    })
  })

  it('returns empty list when user has no tickets', async () => {
    ticketRepo.findByAuthor.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({
      authorId: 'user-2',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('passes pagination params to repository', async () => {
    ticketRepo.findByAuthor.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ authorId: 'user-1', page: 2, perPage: 5 })

    expect(ticketRepo.findByAuthor).toHaveBeenCalledWith('user-1', {
      page: 2,
      perPage: 5,
    })
  })
})
