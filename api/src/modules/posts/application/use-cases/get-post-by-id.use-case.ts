import { Injectable, NotFoundException } from '@nestjs/common'
import { Post } from '../../domain/entities/post'
import { PostRepository } from '../../domain/repositories/post.repository'
import { BlockRepository } from '../../domain/repositories/block.repository'

export interface GetPostByIdInput {
  postId: string
  requesterId: string
}

@Injectable()
export class GetPostByIdUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly blockRepository: BlockRepository,
  ) {}

  async execute(input: GetPostByIdInput): Promise<Post> {
    const blockedIds = await this.blockRepository.findBlockedUserIds(
      input.requesterId,
    )
    const post = await this.postRepository.findById(input.postId, blockedIds)
    if (!post) throw new NotFoundException('Post not found')
    return post
  }
}
