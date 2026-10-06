import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface FindUserByIdInput {
  id: string
}

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: FindUserByIdInput): Promise<User> {
    // findByIdWithAnimalsCount (não findById) porque os endpoints que usam
    // este use-case (GET /users/me, GET /users/:id, link/unlink do Google,
    // lookup interno do update) devem exibir animalsCount corretamente.
    // findById puro fica reservado para o hot-path do AuthGuard.
    const user = await this.userRepository.findByIdWithAnimalsCount(input.id)
    if (!user) throw new NotFoundException('User not found')
    return user
  }
}
