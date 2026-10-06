import { NotFoundException } from '@nestjs/common'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import {
  AttendanceStatus,
  EventAttendance,
} from '../../domain/entities/event-attendance'
import { EventAttendanceRepository } from '../../domain/repositories/event-attendance.repository'
import { CancelEventAttendanceUseCase } from './cancel-event-attendance.use-case'

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

function makeAttendance(status: AttendanceStatus): EventAttendance {
  return EventAttendance.reconstitute(
    { eventId: 'event-1', userId: 'user-1', status, createdAt: new Date() },
    new UniqueEntityID('att-1'),
  )
}

describe('CancelEventAttendanceUseCase', () => {
  let useCase: CancelEventAttendanceUseCase
  let attendanceRepo: jest.Mocked<EventAttendanceRepository>

  beforeEach(() => {
    attendanceRepo = mockAttendanceRepo()
    useCase = new CancelEventAttendanceUseCase(attendanceRepo)
  })

  it('throws NotFoundException when attendance does not exist', async () => {
    attendanceRepo.findByEventAndUser.mockResolvedValue(null)

    await expect(
      useCase.execute({ eventId: 'event-1', userId: 'user-1' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('promotes the next waitlisted attendee after cancelling a CONFIRMED spot', async () => {
    attendanceRepo.findByEventAndUser.mockResolvedValue(
      makeAttendance(AttendanceStatus.CONFIRMED),
    )
    attendanceRepo.countByEvent.mockResolvedValue(4)

    await useCase.execute({ eventId: 'event-1', userId: 'user-1' })

    expect(attendanceRepo.delete).toHaveBeenCalledWith('att-1')
    expect(attendanceRepo.promoteNextWaitlisted).toHaveBeenCalledWith(
      'event-1',
    )
  })

  it('does not promote anyone when the cancelled attendance was already WAITLIST', async () => {
    attendanceRepo.findByEventAndUser.mockResolvedValue(
      makeAttendance(AttendanceStatus.WAITLIST),
    )
    attendanceRepo.countByEvent.mockResolvedValue(4)

    await useCase.execute({ eventId: 'event-1', userId: 'user-1' })

    expect(attendanceRepo.delete).toHaveBeenCalledWith('att-1')
    expect(attendanceRepo.promoteNextWaitlisted).not.toHaveBeenCalled()
  })
})
