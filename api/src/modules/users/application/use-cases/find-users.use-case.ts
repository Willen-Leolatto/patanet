import { Injectable } from '@nestjs/common'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface FindUsersInput {
  query?: string
  page: number
  perPage: number
}

@Injectable()
export class FindUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    input: FindUsersInput,
  ): Promise<{ items: User[]; total: number }> {
    return this.userRepository.findMany(input)
  }
}
