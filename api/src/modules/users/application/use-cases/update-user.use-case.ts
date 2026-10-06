import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface UpdateUserInput {
  id: string
  name?: string
  displayName?: string
  about?: string
  image?: string
  imageCover?: string
  username?: string
  email?: string
}

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const user = await this.userRepository.findById(input.id)
    if (!user) throw new NotFoundException('User not found')

    if (input.username && input.username !== user.username) {
      const exists = await this.userRepository.findByUsername(input.username)
      if (exists) throw new ConflictException('Username already exists')
    }
    if (input.email && input.email !== user.email) {
      const exists = await this.userRepository.findByEmail(input.email)
      if (exists) throw new ConflictException('Email already exists')
    }

    user.updateProfile({
      name: input.name,
      displayName: input.displayName,
      about: input.about,
      image: input.image,
      imageCover: input.imageCover,
      username: input.username,
      email: input.email,
    })

    await this.userRepository.save(user)
    return user
  }
}
