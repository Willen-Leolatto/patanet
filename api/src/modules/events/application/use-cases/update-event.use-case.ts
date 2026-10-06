import { Injectable, NotFoundException } from '@nestjs/common'
import { Event } from '../../domain/entities/event'
import { EventRepository } from '../../domain/repositories/event.repository'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { Media } from '@modules/posts/domain/entities/media'
import { StoragePort } from '@shared/application/ports/storage.port'

export interface UpdateEventInput {
  requesterId: string
  eventId: string
  title?: string
  description?: string | null
  date?: string | null
  time?: string | null
  locationText?: string | null
  latitude?: number | null
  longitude?: number | null
  imageUrl?: string | null
  capacity?: number | null
}

@Injectable()
export class UpdateEventUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly postRepository: PostRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: UpdateEventInput): Promise<Event> {
    const event = await this.eventRepository.findById(input.eventId)
    if (!event || event.authorId !== input.requesterId)
      throw new NotFoundException('Event not found')
    if (
      input.imageUrl !== undefined &&
      input.imageUrl !== event.imageUrl &&
      event.postId
    ) {
      const medias = await this.mediaRepository.findByPostId(event.postId)
      await Promise.all(medias.map(m => this.storagePort.delete(m.path)))
      await this.mediaRepository.deleteByPostId(event.postId)
      if (input.imageUrl) {
        const media = Media.create({
          path: input.imageUrl,
          type: 'IMAGE',
          postId: event.postId,
        })
        await this.mediaRepository.save(media)
      }
    }
    event.update({
      title: input.title,
      description: input.description,
      date: input.date,
      time: input.time,
      locationText: input.locationText,
      latitude: input.latitude,
      longitude: input.longitude,
      imageUrl: input.imageUrl,
      capacity: input.capacity,
    })
    await this.eventRepository.save(event)
    if (input.title && event.postId) {
      const post = await this.postRepository.findById(event.postId)
      if (post) {
        post.update({ subtitle: input.title })
        await this.postRepository.save(post)
      }
    }
    return event
  }
}
