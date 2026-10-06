import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'

export interface GetConnectionSummaryInput {
  userId: string
  currentUserId?: string
}

export interface ConnectionSummaryOutput {
  followers: number
  followersCount: number
  following: number
  followingCount: number
  followeds: number
  followedsCount: number
  iFollow: boolean
  amIFollowing: boolean
}

@Injectable()
export class GetConnectionSummaryUseCase {
  constructor(
    private readonly connectionRepository: ConnectionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: GetConnectionSummaryInput,
  ): Promise<ConnectionSummaryOutput> {
    const targetUser = await this.userRepository.findById(input.userId)
    if (!targetUser) {
      throw new NotFoundException('User not found')
    }

    const [followersCount, followingCount, existingConnection] =
      await Promise.all([
        this.connectionRepository.countFollowers(input.userId),
        this.connectionRepository.countFollowing(input.userId),
        input.currentUserId && input.currentUserId !== input.userId
          ? this.connectionRepository.findByFollowerAndFollowing(
              input.currentUserId,
              input.userId,
            )
          : Promise.resolve(null),
      ])

    const isFollowing = Boolean(existingConnection)

    return {
      followers: followersCount,
      followersCount,
      following: followingCount,
      followingCount,
      followeds: followingCount,
      followedsCount: followingCount,
      iFollow: isFollowing,
      amIFollowing: isFollowing,
    }
  }
}
