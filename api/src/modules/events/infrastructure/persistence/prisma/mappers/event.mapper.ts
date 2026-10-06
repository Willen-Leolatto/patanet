import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Event } from '@modules/events/domain/entities/event'
import { Event as PrismaEvent } from '@prisma/client'

export class EventMapper {
  static toDomain(row: PrismaEvent): Event {
    return Event.reconstitute(
      {
        title: row.title,
        description: row.description ?? null,
        date: row.date ?? null,
        time: row.time ?? null,
        locationText: row.locationText ?? null,
        latitude: row.latitude != null ? Number(row.latitude) : null,
        longitude: row.longitude != null ? Number(row.longitude) : null,
        imageUrl: row.imageUrl ?? null,
        postId: row.postId ?? null,
        authorId: row.authorId,
        capacity: row.capacity ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Event) {
    return {
      id: domain.id.toValue(),
      title: domain.title,
      description: domain.description ?? null,
      date: domain.date ?? null,
      time: domain.time ?? null,
      locationText: domain.locationText ?? null,
      latitude: domain.latitude ?? null,
      longitude: domain.longitude ?? null,
      imageUrl: domain.imageUrl ?? null,
      postId: domain.postId ?? null,
      authorId: domain.authorId,
      capacity: domain.capacity ?? null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
