import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { Connection } from '../../domain/entities/connection'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'

export interface FollowInput {
  followerId: string
  followingId: string
}

@Injectable()
export class FollowUseCase {
  constructor(
    private readonly connectionRepository: ConnectionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: FollowInput): Promise<void> {
    if (input.followerId === input.followingId) {
      throw new BadRequestException('You cannot follow yourself')
    }

    const targetUser = await this.userRepository.findById(input.followingId)
    if (!targetUser) {
      throw new NotFoundException('User not found')
    }

    const existing = await this.connectionRepository.findByFollowerAndFollowing(
      input.followerId,
      input.followingId,
    )

    if (existing) {
      throw new ConflictException('Already following this user')
    }

    const connection = Connection.create({
      followerId: input.followerId,
      followingId: input.followingId,
    })

    await this.connectionRepository.save(connection)
  }
}
