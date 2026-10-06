import { Injectable, NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { MediaRepository } from '../../domain/repositories/media.repository'
import { CommentRepository } from '../../domain/repositories/comment.repository'
import { LikeRepository } from '../../domain/repositories/like.repository'
import { StoragePort } from '@shared/application/ports/storage.port'

export interface DeletePostInput {
  requesterId: string
  postId: string
}

@Injectable()
export class DeletePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly commentRepository: CommentRepository,
    private readonly likeRepository: LikeRepository,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: DeletePostInput): Promise<void> {
    const post = await this.postRepository.findById(input.postId)
    if (!post) throw new NotFoundException('Post not found')
    if (post.authorId !== input.requesterId)
      throw new NotFoundException('Post not found')

    const medias = await this.mediaRepository.findByPostId(input.postId)
    await Promise.all(medias.map(m => this.storagePort.delete(m.path)))

    await this.commentRepository.deleteByPostId(input.postId)
    await this.likeRepository.deleteByPostId(input.postId)
    await this.mediaRepository.deleteByPostId(input.postId)
    await this.postRepository.delete(input.postId)
  }
}
