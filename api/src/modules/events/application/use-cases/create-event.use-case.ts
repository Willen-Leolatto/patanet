import { BadRequestException, Injectable } from '@nestjs/common'
import { Event } from '../../domain/entities/event'
import { EventRepository } from '../../domain/repositories/event.repository'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { Post } from '@modules/posts/domain/entities/post'
import { Media } from '@modules/posts/domain/entities/media'

export interface CreateEventInput {
  authorId: string
  title: string
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
export class CreateEventUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly postRepository: PostRepository,
    private readonly mediaRepository: MediaRepository,
  ) {}

  async execute(input: CreateEventInput): Promise<Event> {
    const title = (input.title ?? '').trim()
    if (!title) throw new BadRequestException('Título do evento é obrigatório')
    const post = Post.create({
      subtitle: title,
      authorId: input.authorId,
      petIds: [],
    })
    await this.postRepository.save(post)
    if (input.imageUrl) {
      const media = Media.create({
        path: input.imageUrl,
        type: 'IMAGE',
        postId: post.id.toValue(),
      })
      await this.mediaRepository.save(media)
    }
    const event = Event.create({
      title,
      description: input.description ?? null,
      date: input.date ?? null,
      time: input.time ?? null,
      locationText: input.locationText ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      imageUrl: input.imageUrl ?? null,
      postId: post.id.toValue(),
      authorId: input.authorId,
      capacity: input.capacity ?? null,
    })
    await this.eventRepository.save(event)
    return event
  }
}
