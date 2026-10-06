import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface UnlinkGoogleAccountInput {
  userId: string
}

@Injectable()
export class UnlinkGoogleAccountUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UnlinkGoogleAccountInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) throw new NotFoundException('User not found')

    if (!user.password) {
      throw new ConflictException(
        'Set a password before unlinking your Google account, otherwise you would be locked out',
      )
    }

    user.unlinkGoogle()
    await this.userRepository.save(user)
  }
}
