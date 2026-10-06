import { User } from '@modules/users/domain/entities/user'
import { AttendanceStatus, EventAttendance } from '../entities/event-attendance'

export abstract class EventAttendanceRepository {
  abstract findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventAttendance | null>
  abstract findByEvent(
    eventId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: User[]; total: number }>
  abstract countByEvent(eventId: string): Promise<number>
  abstract countByEvents(eventIds: string[]): Promise<Record<string, number>>
  abstract save(attendance: EventAttendance): Promise<void>
  abstract delete(id: string): Promise<void>
  /**
   * Capacidade atomica: decide CONFIRMED vs WAITLIST e grava numa unica
   * transacao com lock na linha do evento, evitando a race condition de um
   * check-then-act separado (ver AttendEventUseCase).
   */
  abstract attend(eventId: string, userId: string): Promise<AttendanceStatus>
  /**
   * Promove o mais antigo da fila de espera pra CONFIRMED -- chamado pelo
   * CancelEventAttendanceUseCase depois de remover uma presenca CONFIRMED.
   */
  abstract promoteNextWaitlisted(
    eventId: string,
  ): Promise<EventAttendance | null>
}
