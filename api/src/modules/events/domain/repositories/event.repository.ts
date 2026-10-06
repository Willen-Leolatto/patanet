import { Event } from '../entities/event'

export abstract class EventRepository {
  abstract findById(id: string): Promise<Event | null>
  abstract findAll(params: {
    page: number
    perPage: number
  }): Promise<{ items: Event[]; total: number }>
  abstract save(event: Event): Promise<void>
  abstract delete(id: string): Promise<void>
  abstract trySetPostId(id: string, postId: string): Promise<boolean>
}
