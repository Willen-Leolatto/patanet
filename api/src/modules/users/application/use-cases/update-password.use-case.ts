import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { HashingPort } from '@shared/application/ports/hashing.port'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface UpdatePasswordInput {
  id: string
  currentPassword?: string
  newPassword: string
}

@Injectable()
export class UpdatePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingPort: HashingPort,
  ) {}

  async execute(input: UpdatePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.id)
    if (!user) throw new NotFoundException('User not found')

    if (user.password) {
      if (!input.currentPassword) {
        throw new UnauthorizedException('Current password is required')
      }
      const isValid = await this.hashingPort.compare(
        input.currentPassword,
        user.password,
      )
      if (!isValid) throw new UnauthorizedException('Invalid password')
    }

    const newHash = await this.hashingPort.hash(input.newPassword)
    user.changePassword(newHash)
    await this.userRepository.save(user)
  }
}
