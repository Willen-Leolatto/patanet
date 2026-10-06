import { Injectable, NotFoundException } from '@nestjs/common'
import { Event } from '../../domain/entities/event'
import { EventRepository } from '../../domain/repositories/event.repository'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { Post } from '@modules/posts/domain/entities/post'
import { Media } from '@modules/posts/domain/entities/media'

export interface RepostEventInput {
  requesterId: string
  eventId: string
}

@Injectable()
export class RepostEventUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly postRepository: PostRepository,
    private readonly mediaRepository: MediaRepository,
  ) {}

  async execute(input: RepostEventInput): Promise<Event> {
    const event = await this.eventRepository.findById(input.eventId)
    if (!event || event.authorId !== input.requesterId)
      throw new NotFoundException('Event not found')
    if (event.postId) {
      const existingPost = await this.postRepository.findById(event.postId)
      if (existingPost) return event
    }
    const post = Post.create({
      subtitle: event.title,
      authorId: event.authorId,
      petIds: [],
    })
    await this.postRepository.save(post)
    if (event.imageUrl) {
      const media = Media.create({
        path: event.imageUrl,
        type: 'IMAGE',
        postId: post.id.toValue(),
      })
      await this.mediaRepository.save(media)
    }
    // Atomically claim the event for this post: the UPDATE only succeeds
    // if no concurrent repost already set postId first. Without this guard,
    // two concurrent reposts of the same event (double-tap, client retry)
    // could each create their own Post row, leaving one orphaned with no
    // event pointing back to it -- which surfaces as a feed post missing
    // its `event` payload.
    const claimed = await this.eventRepository.trySetPostId(
      event.id.toValue(),
      post.id.toValue(),
    )
    if (!claimed) {
      await this.mediaRepository.deleteByPostId(post.id.toValue())
      await this.postRepository.delete(post.id.toValue())
      const winner = await this.eventRepository.findById(event.id.toValue())
      return winner ?? event
    }
    event.setPostId(post.id.toValue())
    return event
  }
}
