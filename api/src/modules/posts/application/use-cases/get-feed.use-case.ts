import { Injectable } from '@nestjs/common'
import { Post } from '../../domain/entities/post'
import { PostRepository } from '../../domain/repositories/post.repository'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'
import { BlockRepository } from '../../domain/repositories/block.repository'

export interface GetFeedInput {
  userId: string
  page: number
  perPage: number
}

export interface GetFeedOutput {
  items: Post[]
  total: number
}

@Injectable()
export class GetFeedUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly connectionRepository: ConnectionRepository,
    private readonly blockRepository: BlockRepository,
  ) {}

  async execute(input: GetFeedInput): Promise<GetFeedOutput> {
    const followedIds = await this.connectionRepository.findFollowedIdsByUserId(
      input.userId,
    )
    const blockedIds = await this.blockRepository.findBlockedUserIds(
      input.userId,
    )
    const visibleFollowedIds = followedIds.filter(
      id => !blockedIds.includes(id),
    )

    return this.postRepository.findFeed(
      input.userId,
      visibleFollowedIds,
      { page: input.page, perPage: input.perPage },
      blockedIds,
    )
  }
}
