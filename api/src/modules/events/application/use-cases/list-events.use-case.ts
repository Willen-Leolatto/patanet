import { Injectable } from '@nestjs/common'
import { Event } from '../../domain/entities/event'
import { EventRepository } from '../../domain/repositories/event.repository'

export interface ListEventsInput {
  page: number
  perPage: number
}

@Injectable()
export class ListEventsUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(
    input: ListEventsInput,
  ): Promise<{ items: Event[]; total: number }> {
    return this.eventRepository.findAll({
      page: input.page,
      perPage: input.perPage,
    })
  }
}
