import { NotFoundException } from '@nestjs/common'
import { UpdateTicketStatusUseCase } from './update-ticket-status.use-case'
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

function makeTicket(id = 'ticket-1'): SupportTicket {
  return SupportTicket.reconstitute(
    {
      authorId: 'user-1',
      category: TicketCategory.GENERAL,
      subject: 'Test ticket',
      status: TicketStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('UpdateTicketStatusUseCase', () => {
  let useCase: UpdateTicketStatusUseCase
  let ticketRepo: jest.Mocked<SupportTicketRepository>

  beforeEach(() => {
    ticketRepo = mockTicketRepo()
    useCase = new UpdateTicketStatusUseCase(ticketRepo)
  })

  it('updates ticket status (happy path)', async () => {
    const ticket = makeTicket()
    ticketRepo.findById.mockResolvedValue(ticket)
    ticketRepo.save.mockResolvedValue()

    const result = await useCase.execute({
      ticketId: 'ticket-1',
      status: TicketStatus.IN_REVIEW,
    })

    expect(result.status).toBe(TicketStatus.IN_REVIEW)
    expect(ticketRepo.save).toHaveBeenCalledWith(ticket)
  })

  it('throws NotFoundException when ticket does not exist', async () => {
    ticketRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        ticketId: 'nonexistent',
        status: TicketStatus.RESOLVED,
      }),
    ).rejects.toThrow(NotFoundException)

    expect(ticketRepo.save).not.toHaveBeenCalled()
  })

  it('can update to all valid statuses', async () => {
    for (const status of Object.values(TicketStatus)) {
      const ticket = makeTicket()
      ticketRepo.findById.mockResolvedValue(ticket)
      ticketRepo.save.mockResolvedValue()

      const result = await useCase.execute({ ticketId: 'ticket-1', status })
      expect(result.status).toBe(status)
    }
  })
})
