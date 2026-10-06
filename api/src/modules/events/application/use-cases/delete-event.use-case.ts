import { Injectable } from '@nestjs/common'
import { EventRepository } from '../../domain/repositories/event.repository'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { CommentRepository } from '@modules/posts/domain/repositories/comment.repository'
import { LikeRepository } from '@modules/posts/domain/repositories/like.repository'
import { StoragePort } from '@shared/application/ports/storage.port'

export interface DeleteEventInput {
  requesterId: string
  eventId: string
}

@Injectable()
export class DeleteEventUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly postRepository: PostRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly commentRepository: CommentRepository,
    private readonly likeRepository: LikeRepository,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: DeleteEventInput): Promise<void> {
    const event = await this.eventRepository.findById(input.eventId)
    if (!event || event.authorId !== input.requesterId) return
    if (event.postId) {
      const medias = await this.mediaRepository.findByPostId(event.postId)
      await Promise.all(medias.map(m => this.storagePort.delete(m.path)))
      await this.commentRepository.deleteByPostId(event.postId)
      await this.likeRepository.deleteByPostId(event.postId)
      await this.mediaRepository.deleteByPostId(event.postId)
      await this.postRepository.delete(event.postId)
    }
    await this.eventRepository.delete(input.eventId)
  }
}
