import { Injectable, NotFoundException } from '@nestjs/common'
import { AttendanceStatus } from '../../domain/entities/event-attendance'
import { EventAttendanceRepository } from '../../domain/repositories/event-attendance.repository'

export interface CancelEventAttendanceInput {
  userId: string
  eventId: string
}

@Injectable()
export class CancelEventAttendanceUseCase {
  constructor(
    private readonly eventAttendanceRepository: EventAttendanceRepository,
  ) {}

  async execute(
    input: CancelEventAttendanceInput,
  ): Promise<{ ok: true; attendeesCount: number }> {
    const existing = await this.eventAttendanceRepository.findByEventAndUser(
      input.eventId,
      input.userId,
    )
    if (!existing) throw new NotFoundException('Attendance not found')

    const wasConfirmed = existing.status === AttendanceStatus.CONFIRMED
    await this.eventAttendanceRepository.delete(existing.id.toValue())

    // Uma vaga CONFIRMED abriu: promove automaticamente o mais antigo da
    // fila de espera, se houver.
    if (wasConfirmed) {
      await this.eventAttendanceRepository.promoteNextWaitlisted(
        input.eventId,
      )
    }

    const attendeesCount = await this.eventAttendanceRepository.countByEvent(
      input.eventId,
    )
    return { ok: true, attendeesCount }
  }
}
