import { Injectable, NotFoundException } from '@nestjs/common'
import { AttendanceStatus } from '../../domain/entities/event-attendance'
import { EventAttendanceRepository } from '../../domain/repositories/event-attendance.repository'
import { EventRepository } from '../../domain/repositories/event.repository'

export interface AttendEventInput {
  userId: string
  eventId: string
}

@Injectable()
export class AttendEventUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventAttendanceRepository: EventAttendanceRepository,
  ) {}

  async execute(
    input: AttendEventInput,
  ): Promise<{ ok: true; status: AttendanceStatus; attendeesCount: number }> {
    const event = await this.eventRepository.findById(input.eventId)
    if (!event) throw new NotFoundException('Event not found')

    const existing = await this.eventAttendanceRepository.findByEventAndUser(
      input.eventId,
      input.userId,
    )

    // Idempotente: chamar de novo so retorna o status atual, sem disputar
    // outra vaga. A decisao CONFIRMED/WAITLIST e atomica (lock na linha do
    // evento) -- ver PrismaEventAttendanceRepository.attend.
    const status =
      existing?.status ??
      (await this.eventAttendanceRepository.attend(
        input.eventId,
        input.userId,
      ))

    const attendeesCount = await this.eventAttendanceRepository.countByEvent(
      input.eventId,
    )
    return { ok: true, status, attendeesCount }
  }
}
