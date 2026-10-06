import { Injectable, NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { LikeRepository } from '../../domain/repositories/like.repository'
import { Like } from '../../domain/entities/like'

export interface ToggleLikeInput {
  userId: string
  postId: string
  action: 'like' | 'unlike'
}

@Injectable()
export class ToggleLikeUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly likeRepository: LikeRepository,
  ) {}

  async execute(input: ToggleLikeInput): Promise<void> {
    const post = await this.postRepository.findById(input.postId)
    if (!post) throw new NotFoundException('Post not found')

    const existing = await this.likeRepository.findByUserAndPost(
      input.userId,
      input.postId,
    )

    if (input.action === 'like') {
      if (existing) return
      const like = Like.create({ userId: input.userId, postId: input.postId })
      await this.likeRepository.save(like)
      return
    }

    if (!existing) return
    await this.likeRepository.delete(existing.id.toValue())
  }
}
