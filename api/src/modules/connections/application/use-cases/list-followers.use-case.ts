import { Injectable } from '@nestjs/common'
import { User } from '@modules/users/domain/entities/user'
import { ConnectionRepository } from '../../domain/repositories/connection.repository'

export interface ListFollowersInput {
  userId: string
  page: number
  perPage: number
}

export interface ListFollowersOutput {
  items: User[]
  total: number
}

@Injectable()
export class ListFollowersUseCase {
  constructor(private readonly connectionRepository: ConnectionRepository) {}

  async execute(input: ListFollowersInput): Promise<ListFollowersOutput> {
    return this.connectionRepository.findFollowers(input.userId, {
      page: input.page,
      perPage: input.perPage,
    })
  }
}
