import { BadRequestException } from '@nestjs/common'
import { CreateTicketUseCase } from './create-ticket.use-case'
import { SupportTicketRepository } from '../../domain/repositories/support-ticket.repository'
import { SupportTicketMessageRepository } from '../../domain/repositories/support-ticket-message.repository'
import {
  TicketCategory,
  TicketStatus,
} from '../../domain/entities/support-ticket'

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

describe('CreateTicketUseCase', () => {
  let useCase: CreateTicketUseCase
  let ticketRepo: jest.Mocked<SupportTicketRepository>
  let messageRepo: jest.Mocked<SupportTicketMessageRepository>

  beforeEach(() => {
    ticketRepo = mockTicketRepo()
    messageRepo = mockMessageRepo()
    useCase = new CreateTicketUseCase(ticketRepo, messageRepo)
  })

  it('creates a ticket with initial message (happy path)', async () => {
    ticketRepo.save.mockResolvedValue()
    messageRepo.save.mockResolvedValue()

    const ticket = await useCase.execute({
      authorId: 'user-1',
      category: TicketCategory.GENERAL,
      subject: 'My support request',
      message: 'I need help with my account',
    })

    expect(ticket).toBeDefined()
    expect(ticket.authorId).toBe('user-1')
    expect(ticket.category).toBe(TicketCategory.GENERAL)
    expect(ticket.subject).toBe('My support request')
    expect(ticket.status).toBe(TicketStatus.OPEN)
    expect(ticketRepo.save).toHaveBeenCalledWith(ticket)
    expect(messageRepo.save).toHaveBeenCalledTimes(1)
  })

  it('creates a ticket with attachments', async () => {
    ticketRepo.save.mockResolvedValue()
    messageRepo.save.mockResolvedValue()

    await useCase.execute({
      authorId: 'user-1',
      category: TicketCategory.PRIVACY,
      subject: 'Privacy concern',
      message: 'Please delete my data',
      attachments: ['https://example.com/file.pdf'],
    })

    const savedMessage = messageRepo.save.mock.calls[0][0]
    expect(savedMessage.attachments).toEqual(['https://example.com/file.pdf'])
  })

  it('throws BadRequestException when subject exceeds 120 characters', async () => {
    const longSubject = 'A'.repeat(121)

    await expect(
      useCase.execute({
        authorId: 'user-1',
        category: TicketCategory.GENERAL,
        subject: longSubject,
        message: 'Some message',
      }),
    ).rejects.toThrow(BadRequestException)

    expect(ticketRepo.save).not.toHaveBeenCalled()
    expect(messageRepo.save).not.toHaveBeenCalled()
  })

  it('accepts subject with exactly 120 characters', async () => {
    ticketRepo.save.mockResolvedValue()
    messageRepo.save.mockResolvedValue()

    const subject = 'A'.repeat(120)
    const ticket = await useCase.execute({
      authorId: 'user-1',
      category: TicketCategory.GENERAL,
      subject,
      message: 'Some message',
    })

    expect(ticket.subject).toBe(subject)
  })
})
