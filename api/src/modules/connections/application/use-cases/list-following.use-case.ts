import { Injectable } from '@nestjs/common'
import { User } from '@modules/users/domain/entities/user'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'

export interface ListFollowingInput {
  userId: string
  page: number
  perPage: number
}

export interface ListFollowingOutput {
  items: User[]
  total: number
}

@Injectable()
export class ListFollowingUseCase {
  constructor(private readonly connectionRepository: ConnectionRepository) {}

  async execute(input: ListFollowingInput): Promise<ListFollowingOutput> {
    return this.connectionRepository.findFollowing(input.userId, {
      page: input.page,
      perPage: input.perPage,
    })
  }
}
