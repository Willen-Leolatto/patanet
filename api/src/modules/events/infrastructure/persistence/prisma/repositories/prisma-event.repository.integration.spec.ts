import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Event } from '@modules/events/domain/entities/event'
import { EventRepository } from '@modules/events/domain/repositories/event.repository'
import { PrismaEventRepository } from './prisma-event.repository'

describe('PrismaEventRepository (integration)', () => {
  let module: TestingModule
  let repository: EventRepository
  let prisma: PrismaService
  let testUserId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: EventRepository, useClass: PrismaEventRepository },
      ],
    }).compile()

    repository = module.get(EventRepository)
    prisma = module.get(PrismaService)

    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: 'Event Integration User',
        username: `event_int_${Date.now()}`,
        email: `event_int_${Date.now()}@example.com`,
        password: 'hashed',
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    await prisma.event.deleteMany({})
    await prisma.user.deleteMany({ where: { id: testUserId } })
    await module.close()
  })

  beforeEach(async () => {
    await prisma.event.deleteMany({})
  })

  function makeEvent(title = 'Evento Teste'): Event {
    return Event.create({ title, authorId: testUserId })
  }

  it('saves and finds an event by id', async () => {
    const event = makeEvent()
    await repository.save(event)

    const found = await repository.findById(event.id.toValue())
    expect(found).not.toBeNull()
    expect(found!.title).toBe('Evento Teste')
    expect(found!.id.toValue()).toBe(event.id.toValue())
  })

  it('returns null for a non-existent event', async () => {
    const found = await repository.findById('nonexistent-id')
    expect(found).toBeNull()
  })

  it('findAll returns all saved events with pagination', async () => {
    await repository.save(makeEvent('Evento A'))
    await repository.save(makeEvent('Evento B'))

    const { items, total } = await repository.findAll({ page: 1, perPage: 10 })
    expect(total).toBeGreaterThanOrEqual(2)
    expect(items.length).toBeGreaterThanOrEqual(2)
  })

  it('findAll supports pagination', async () => {
    for (let i = 0; i < 4; i++) {
      await repository.save(makeEvent(`Evento ${i}`))
    }

    const page1 = await repository.findAll({ page: 1, perPage: 2 })
    expect(page1.items.length).toBeLessThanOrEqual(2)
    expect(page1.total).toBeGreaterThanOrEqual(4)
  })

  it('deletes an event', async () => {
    const event = makeEvent()
    await repository.save(event)

    await repository.delete(event.id.toValue())

    const found = await repository.findById(event.id.toValue())
    expect(found).toBeNull()
  })

  it('saves and retrieves latitude/longitude correctly', async () => {
    const event = Event.create({
      title: 'Evento com coords',
      authorId: testUserId,
      latitude: 12.3456789,
      longitude: -34.5678901,
    })

    await repository.save(event)
    const found = await repository.findById(event.id.toValue())

    expect(found).not.toBeNull()
    expect(Number(found!.latitude)).toBeCloseTo(12.3456789, 4)
    expect(Number(found!.longitude)).toBeCloseTo(-34.5678901, 4)
  })
})
