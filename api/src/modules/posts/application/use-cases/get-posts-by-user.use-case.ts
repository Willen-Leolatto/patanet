import { Injectable } from '@nestjs/common'
import { Post } from '../../domain/entities/post'
import { PostRepository } from '../../domain/repositories/post.repository'
import { BlockRepository } from '../../domain/repositories/block.repository'

export interface GetPostsByUserInput {
  userId: string
  requesterId: string
  page: number
  perPage: number
}

export interface GetPostsByUserOutput {
  items: Post[]
  total: number
}

@Injectable()
export class GetPostsByUserUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly blockRepository: BlockRepository,
  ) {}

  async execute(input: GetPostsByUserInput): Promise<GetPostsByUserOutput> {
    const blockedIds = await this.blockRepository.findBlockedUserIds(
      input.requesterId,
    )
    return this.postRepository.findByUserId(
      input.userId,
      { page: input.page, perPage: input.perPage },
      blockedIds,
    )
  }
}
