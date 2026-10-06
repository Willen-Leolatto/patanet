import { Event } from '../../domain/entities/event'

export class ResponseEventDto {
  readonly id: string
  readonly title: string
  readonly description?: string | null
  readonly date?: string | null
  readonly time?: string | null
  readonly locationText?: string | null
  readonly latitude?: number | null
  readonly longitude?: number | null
  readonly imageUrl?: string | null
  readonly postId?: string | null
  readonly authorId: string
  readonly capacity?: number | null
  readonly attendeesCount: number
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(event: Event, extra?: { attendeesCount?: number }) {
    this.id = event.id.toValue()
    this.title = event.title
    this.description = event.description ?? null
    this.date = event.date ?? null
    this.time = event.time ?? null
    this.locationText = event.locationText ?? null
    this.latitude = event.latitude ?? null
    this.longitude = event.longitude ?? null
    this.imageUrl = event.imageUrl ?? null
    this.postId = event.postId ?? null
    this.authorId = event.authorId
    this.capacity = event.capacity ?? null
    this.attendeesCount = extra?.attendeesCount ?? 0
    this.createdAt = event.createdAt
    this.updatedAt = event.updatedAt
  }
}
