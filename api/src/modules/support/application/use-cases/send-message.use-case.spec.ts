import { NotFoundException } from '@nestjs/common'
import { SendMessageUseCase } from './send-message.use-case'
import { SupportTicketRepository } from '../../domain/repositories/support-ticket.repository'
import { SupportTicketMessageRepository } from '../../domain/repositories/support-ticket-message.repository'
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

const mockMessageRepo = (): jest.Mocked<SupportTicketMessageRepository> =>
  ({
    findByTicket: jest.fn(),
    save: jest.fn(),
  }) as unknown as jest.Mocked<SupportTicketMessageRepository>

function makeTicket(authorId: string, id = 'ticket-1'): SupportTicket {
  return SupportTicket.reconstitute(
    {
      authorId,
      category: TicketCategory.GENERAL,
      subject: 'Test ticket',
      status: TicketStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(id),
  )
}

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase
  let ticketRepo: jest.Mocked<SupportTicketRepository>
  let messageRepo: jest.Mocked<SupportTicketMessageRepository>

  beforeEach(() => {
    ticketRepo = mockTicketRepo()
    messageRepo = mockMessageRepo()
    useCase = new SendMessageUseCase(ticketRepo, messageRepo)
  })

  it('sends a message to an existing ticket (happy path)', async () => {
    const ticket = makeTicket('user-1')
    ticketRepo.findById.mockResolvedValue(ticket)
    messageRepo.save.mockResolvedValue()
    ticketRepo.save.mockResolvedValue()

    await expect(
      useCase.execute({
        authorId: 'user-1',
        ticketId: 'ticket-1',
        message: 'Follow-up message',
      }),
    ).resolves.toBeUndefined()

    expect(messageRepo.save).toHaveBeenCalledTimes(1)
    expect(ticketRepo.save).toHaveBeenCalledWith(ticket)
  })

  it('throws NotFoundException when ticket does not exist', async () => {
    ticketRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        authorId: 'user-1',
        ticketId: 'nonexistent-ticket',
        message: 'Some message',
      }),
    ).rejects.toThrow(NotFoundException)

    expect(messageRepo.save).not.toHaveBeenCalled()
  })

  it('throws NotFoundException when ticket belongs to a different user', async () => {
    const ticket = makeTicket('other-user')
    ticketRepo.findById.mockResolvedValue(ticket)

    await expect(
      useCase.execute({
        authorId: 'user-1',
        ticketId: 'ticket-1',
        message: 'Some message',
      }),
    ).rejects.toThrow(NotFoundException)

    expect(messageRepo.save).not.toHaveBeenCalled()
  })
})
