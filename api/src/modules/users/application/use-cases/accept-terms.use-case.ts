import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface AcceptTermsInput {
  id: string
  version: string
}

@Injectable()
export class AcceptTermsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: AcceptTermsInput): Promise<User> {
    const user = await this.userRepository.findById(input.id)
    if (!user) throw new NotFoundException('User not found')

    user.acceptTerms(input.version)
    await this.userRepository.save(user)
    return user
  }
}
