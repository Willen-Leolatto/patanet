import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { SupportTicketRepository } from '@modules/support/domain/repositories/support-ticket.repository'
import { SupportTicketMessageRepository } from '@modules/support/domain/repositories/support-ticket-message.repository'
import {
  SupportTicket,
  TicketCategory,
  TicketStatus,
} from '@modules/support/domain/entities/support-ticket'
import { SupportTicketMessage } from '@modules/support/domain/entities/support-ticket-message'
import { PrismaSupportTicketRepository } from './prisma-support-ticket.repository'
import { PrismaSupportTicketMessageRepository } from './prisma-support-ticket-message.repository'

describe('PrismaSupportTicketRepository (integration)', () => {
  let module: TestingModule
  let ticketRepo: SupportTicketRepository
  let messageRepo: SupportTicketMessageRepository
  let prisma: PrismaService
  let userAId: string
  let userBId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: SupportTicketRepository,
          useClass: PrismaSupportTicketRepository,
        },
        {
          provide: SupportTicketMessageRepository,
          useClass: PrismaSupportTicketMessageRepository,
        },
      ],
    }).compile()

    ticketRepo = module.get(SupportTicketRepository)
    messageRepo = module.get(SupportTicketMessageRepository)
    prisma = module.get(PrismaService)

    const ts = Date.now()
    const [userA, userB] = await Promise.all([
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Support User A',
          username: `support_a_${ts}`,
          email: `support_a_${ts}@example.com`,
          password: 'hashed',
        },
      }),
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Support User B',
          username: `support_b_${ts}`,
          email: `support_b_${ts}@example.com`,
          password: 'hashed',
        },
      }),
    ])
    userAId = userA.id
    userBId = userB.id
  })

  afterAll(async () => {
    await prisma.supportTicketMessage.deleteMany({})
    await prisma.supportTicket.deleteMany({})
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } })
    await module.close()
  })

  beforeEach(async () => {
    await prisma.supportTicketMessage.deleteMany({})
    await prisma.supportTicket.deleteMany({})
  })

  function makeTicket(authorId: string): SupportTicket {
    return SupportTicket.create({
      authorId,
      category: TicketCategory.GENERAL,
      subject: 'Test ticket',
    })
  }

  it('saves and finds a ticket by id', async () => {
    const ticket = makeTicket(userAId)
    await ticketRepo.save(ticket)

    const found = await ticketRepo.findById(ticket.id.toValue())
    expect(found).not.toBeNull()
    expect(found!.authorId).toBe(userAId)
    expect(found!.status).toBe(TicketStatus.OPEN)
  })

  it('returns null when ticket does not exist', async () => {
    const found = await ticketRepo.findById('nonexistent-id')
    expect(found).toBeNull()
  })

  it('findByAuthor returns only tickets for that user', async () => {
    await ticketRepo.save(makeTicket(userAId))
    await ticketRepo.save(makeTicket(userAId))
    await ticketRepo.save(makeTicket(userBId))

    const { items, total } = await ticketRepo.findByAuthor(userAId, {
      page: 1,
      perPage: 10,
    })
    expect(total).toBe(2)
    expect(items).toHaveLength(2)
    items.forEach(t => expect(t.authorId).toBe(userAId))
  })

  it('findByAuthor supports pagination', async () => {
    await ticketRepo.save(makeTicket(userAId))
    await ticketRepo.save(makeTicket(userAId))
    await ticketRepo.save(makeTicket(userAId))

    const page1 = await ticketRepo.findByAuthor(userAId, {
      page: 1,
      perPage: 2,
    })
    expect(page1.items).toHaveLength(2)
    expect(page1.total).toBe(3)

    const page2 = await ticketRepo.findByAuthor(userAId, {
      page: 2,
      perPage: 2,
    })
    expect(page2.items).toHaveLength(1)
  })

  it('findAll returns all tickets with pagination', async () => {
    await ticketRepo.save(makeTicket(userAId))
    await ticketRepo.save(makeTicket(userBId))

    const { items, total } = await ticketRepo.findAll({ page: 1, perPage: 10 })
    expect(total).toBe(2)
    expect(items).toHaveLength(2)
  })

  it('updates ticket status via save', async () => {
    const ticket = makeTicket(userAId)
    await ticketRepo.save(ticket)

    ticket.updateStatus(TicketStatus.IN_REVIEW)
    await ticketRepo.save(ticket)

    const found = await ticketRepo.findById(ticket.id.toValue())
    expect(found!.status).toBe(TicketStatus.IN_REVIEW)
  })

  it('saves and retrieves messages for a ticket', async () => {
    const ticket = makeTicket(userAId)
    await ticketRepo.save(ticket)

    const msg1 = SupportTicketMessage.create({
      ticketId: ticket.id.toValue(),
      authorId: userAId,
      message: 'First message',
      attachments: null,
    })
    const msg2 = SupportTicketMessage.create({
      ticketId: ticket.id.toValue(),
      authorId: userAId,
      message: 'Second message',
      attachments: null,
    })

    await messageRepo.save(msg1)
    await messageRepo.save(msg2)

    const messages = await messageRepo.findByTicket(ticket.id.toValue())
    expect(messages).toHaveLength(2)
    expect(messages.map(m => m.message)).toEqual(
      expect.arrayContaining(['First message', 'Second message']),
    )
    expect(messages.every(m => m.ticketId === ticket.id.toValue())).toBe(true)
  })

  it('saves message with attachments', async () => {
    const ticket = makeTicket(userAId)
    await ticketRepo.save(ticket)

    const msg = SupportTicketMessage.create({
      ticketId: ticket.id.toValue(),
      authorId: userAId,
      message: 'Message with attachment',
      attachments: ['https://example.com/file.pdf'],
    })
    await messageRepo.save(msg)

    const messages = await messageRepo.findByTicket(ticket.id.toValue())
    expect(messages[0].attachments).toEqual(['https://example.com/file.pdf'])
  })
})
