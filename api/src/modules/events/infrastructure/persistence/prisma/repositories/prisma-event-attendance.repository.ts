import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import {
  AttendanceStatus,
  EventAttendance,
} from '@modules/events/domain/entities/event-attendance'
import { EventAttendanceRepository } from '@modules/events/domain/repositories/event-attendance.repository'
import { User } from '@modules/users/domain/entities/user'
import { UserMapper } from '@modules/users/infrastructure/persistence/prisma/mappers/user.mapper'
import { EventAttendanceMapper } from '../mappers/event-attendance.mapper'

@Injectable()
export class PrismaEventAttendanceRepository
  implements EventAttendanceRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventAttendance | null> {
    const row = await this.prisma.eventAttendance.findUnique({
      where: { eventId_userId: { eventId, userId } },
    })
    return row ? EventAttendanceMapper.toDomain(row) : null
  }

  async findByEvent(
    eventId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: User[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.eventAttendance.findMany({
        where: { eventId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.eventAttendance.count({ where: { eventId } }),
    ])
    return { items: rows.map(row => UserMapper.toDomain(row.user)), total }
  }

  // So conta CONFIRMED -- quem esta na fila de espera ainda nao "vai" ao
  // evento (ver AttendanceStatus.WAITLIST).
  async countByEvent(eventId: string): Promise<number> {
    return this.prisma.eventAttendance.count({
      where: { eventId, status: 'CONFIRMED' },
    })
  }

  async countByEvents(eventIds: string[]): Promise<Record<string, number>> {
    if (!eventIds.length) return {}
    const rows = await this.prisma.eventAttendance.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds }, status: 'CONFIRMED' },
      _count: { _all: true },
    })
    return rows.reduce(
      (acc, r) => {
        acc[r.eventId] = r._count._all
        return acc
      },
      {} as Record<string, number>,
    )
  }

  async save(attendance: EventAttendance): Promise<void> {
    const data = EventAttendanceMapper.toPersistence(attendance)
    const exists = await this.prisma.eventAttendance.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.eventAttendance.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.eventAttendance.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.eventAttendance.deleteMany({ where: { id } })
  }

  async attend(eventId: string, userId: string): Promise<AttendanceStatus> {
    return this.prisma.$transaction(async tx => {
      // Trava a linha do evento pra serializar concorrentes disputando as
      // ultimas vagas -- sem isso, dois requests simultaneos poderiam ler
      // a mesma contagem e ambos confirmarem, estourando a capacidade.
      const locked = await tx.$queryRaw<{ capacity: number | null }[]>`
        SELECT capacity FROM events WHERE id = ${eventId} FOR UPDATE
      `
      const capacity = locked[0]?.capacity ?? null

      const confirmedCount = await tx.eventAttendance.count({
        where: { eventId, status: 'CONFIRMED' },
      })

      const status: AttendanceStatus =
        capacity == null || confirmedCount < capacity
          ? AttendanceStatus.CONFIRMED
          : AttendanceStatus.WAITLIST

      await tx.eventAttendance.create({
        data: {
          id: randomUUID(),
          eventId,
          userId,
          status: status as never,
        },
      })

      return status
    })
  }

  async promoteNextWaitlisted(eventId: string): Promise<EventAttendance | null> {
    const oldest = await this.prisma.eventAttendance.findFirst({
      where: { eventId, status: 'WAITLIST' },
      orderBy: { createdAt: 'asc' },
    })
    if (!oldest) return null

    const updated = await this.prisma.eventAttendance.update({
      where: { id: oldest.id },
      data: { status: 'CONFIRMED' },
    })
    return EventAttendanceMapper.toDomain(updated)
  }
}
