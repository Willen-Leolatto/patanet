import { NotFoundException } from '@nestjs/common'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Event } from '../../domain/entities/event'
import {
  AttendanceStatus,
  EventAttendance,
} from '../../domain/entities/event-attendance'
import { EventRepository } from '../../domain/repositories/event.repository'
import { EventAttendanceRepository } from '../../domain/repositories/event-attendance.repository'
import { AttendEventUseCase } from './attend-event.use-case'

const mockEventRepo = (): jest.Mocked<EventRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  trySetPostId: jest.fn(),
})

const mockAttendanceRepo = (): jest.Mocked<EventAttendanceRepository> => ({
  findByEventAndUser: jest.fn(),
  findByEvent: jest.fn(),
  countByEvent: jest.fn(),
  countByEvents: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  attend: jest.fn(),
  promoteNextWaitlisted: jest.fn(),
})

function makeEvent(capacity: number | null = null): Event {
  return Event.create({ title: 'Evento', authorId: 'author-1', capacity })
}

describe('AttendEventUseCase', () => {
  let useCase: AttendEventUseCase
  let eventRepo: jest.Mocked<EventRepository>
  let attendanceRepo: jest.Mocked<EventAttendanceRepository>

  beforeEach(() => {
    eventRepo = mockEventRepo()
    attendanceRepo = mockAttendanceRepo()
    useCase = new AttendEventUseCase(eventRepo, attendanceRepo)
  })

  it('throws NotFoundException when event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ eventId: 'event-1', userId: 'user-1' }),
    ).rejects.toThrow(NotFoundException)
    expect(attendanceRepo.attend).not.toHaveBeenCalled()
  })

  it('delegates the CONFIRMED/WAITLIST decision to the atomic repository call', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent(1))
    attendanceRepo.findByEventAndUser.mockResolvedValue(null)
    attendanceRepo.attend.mockResolvedValue(AttendanceStatus.WAITLIST)
    attendanceRepo.countByEvent.mockResolvedValue(1)

    const result = await useCase.execute({
      eventId: 'event-1',
      userId: 'user-1',
    })

    expect(attendanceRepo.attend).toHaveBeenCalledWith('event-1', 'user-1')
    expect(result).toEqual({
      ok: true,
      status: AttendanceStatus.WAITLIST,
      attendeesCount: 1,
    })
  })

  it('is idempotent: returns the existing status without calling attend again', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent(5))
    const existing = EventAttendance.reconstitute(
      {
        eventId: 'event-1',
        userId: 'user-1',
        status: AttendanceStatus.CONFIRMED,
        createdAt: new Date(),
      },
      new UniqueEntityID('att-1'),
    )
    attendanceRepo.findByEventAndUser.mockResolvedValue(existing)
    attendanceRepo.countByEvent.mockResolvedValue(3)

    const result = await useCase.execute({
      eventId: 'event-1',
      userId: 'user-1',
    })

    expect(attendanceRepo.attend).not.toHaveBeenCalled()
    expect(result.status).toBe(AttendanceStatus.CONFIRMED)
  })
})
