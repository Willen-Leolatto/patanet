import { Injectable } from '@nestjs/common'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'

export interface UnfollowInput {
  followerId: string
  followingId: string
}

@Injectable()
export class UnfollowUseCase {
  constructor(private readonly connectionRepository: ConnectionRepository) {}

  async execute(input: UnfollowInput): Promise<void> {
    const existing = await this.connectionRepository.findByFollowerAndFollowing(
      input.followerId,
      input.followingId,
    )

    if (!existing) return

    await this.connectionRepository.delete(existing.id.toValue())
  }
}
