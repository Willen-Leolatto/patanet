import { Injectable } from '@nestjs/common'
import { User } from '@modules/users/domain/entities/user'
import { EventAttendanceRepository } from '../../domain/repositories/event-attendance.repository'

export interface ListEventAttendeesInput {
  eventId: string
  page: number
  perPage: number
}

@Injectable()
export class ListEventAttendeesUseCase {
  constructor(
    private readonly eventAttendanceRepository: EventAttendanceRepository,
  ) {}

  async execute(
    input: ListEventAttendeesInput,
  ): Promise<{ items: User[]; total: number }> {
    return this.eventAttendanceRepository.findByEvent(input.eventId, {
      page: input.page,
      perPage: input.perPage,
    })
  }
}
