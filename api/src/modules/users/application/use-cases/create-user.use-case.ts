import { ConflictException, Injectable } from '@nestjs/common'
import { HashingPort } from '@shared/application/ports/hashing.port'
import { User } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface CreateUserInput {
  name: string
  username: string
  email: string
  password: string
  image?: string | null
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingPort: HashingPort,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const emailExists = await this.userRepository.findByEmail(input.email)
    if (emailExists) throw new ConflictException('Email already exists')

    const usernameExists = await this.userRepository.findByUsername(
      input.username,
    )
    if (usernameExists) throw new ConflictException('Username already exists')

    const hashedPassword = await this.hashingPort.hash(input.password)

    const user = User.create({
      name: input.name,
      username: input.username,
      email: input.email,
      password: hashedPassword,
      googleId: null,
      image: input.image ?? null,
      displayName: null,
      about: null,
      imageCover: null,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
    })

    await this.userRepository.save(user)
    return user
  }
}
