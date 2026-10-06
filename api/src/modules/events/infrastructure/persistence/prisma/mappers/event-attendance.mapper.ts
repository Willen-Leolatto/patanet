import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import {
  AttendanceStatus,
  EventAttendance,
} from '@modules/events/domain/entities/event-attendance'
import { EventAttendance as PrismaEventAttendance } from '@prisma/client'

export class EventAttendanceMapper {
  static toDomain(row: PrismaEventAttendance): EventAttendance {
    return EventAttendance.reconstitute(
      {
        eventId: row.eventId,
        userId: row.userId,
        status: row.status as unknown as AttendanceStatus,
        createdAt: row.createdAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: EventAttendance) {
    return {
      id: domain.id.toValue(),
      eventId: domain.eventId,
      userId: domain.userId,
      status: domain.status as unknown as PrismaEventAttendance['status'],
      createdAt: domain.createdAt,
    }
  }
}
