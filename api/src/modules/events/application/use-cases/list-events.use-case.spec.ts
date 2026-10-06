import { EventRepository } from '../../domain/repositories/event.repository'
import { Event } from '../../domain/entities/event'
import { ListEventsUseCase } from './list-events.use-case'

const mockEventRepo = (): jest.Mocked<EventRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

function makeEvent(title = 'Test Event'): Event {
  return Event.create({ title, authorId: 'user-1' })
}

describe('ListEventsUseCase', () => {
  let useCase: ListEventsUseCase
  let eventRepo: jest.Mocked<EventRepository>

  beforeEach(() => {
    eventRepo = mockEventRepo()
    useCase = new ListEventsUseCase(eventRepo)
  })

  it('returns paginated events', async () => {
    const events = [makeEvent('E1'), makeEvent('E2')]
    eventRepo.findAll.mockResolvedValue({ items: events, total: 2 })

    const result = await useCase.execute({ page: 1, perPage: 10 })

    expect(result.total).toBe(2)
    expect(result.items).toHaveLength(2)
    expect(eventRepo.findAll).toHaveBeenCalledWith({ page: 1, perPage: 10 })
  })

  it('returns empty list when no events exist', async () => {
    eventRepo.findAll.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({ page: 1, perPage: 10 })

    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  it('passes correct pagination params to repository', async () => {
    eventRepo.findAll.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ page: 3, perPage: 5 })

    expect(eventRepo.findAll).toHaveBeenCalledWith({ page: 3, perPage: 5 })
  })
})
