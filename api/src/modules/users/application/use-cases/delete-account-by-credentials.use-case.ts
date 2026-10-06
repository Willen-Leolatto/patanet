import { Injectable, UnauthorizedException } from '@nestjs/common'
import { HashingPort } from '@shared/application/ports/hashing.port'
import { UserRepository } from '../../domain/repositories/user.repository'
import { DeleteUserUseCase } from './delete-user.use-case'

export interface DeleteAccountByCredentialsInput {
  email: string
  password: string
}

/**
 * Rota publica web (sem JWT) exigida pela Play Store: o link de exclusao de
 * conta precisa funcionar fora do app, entao reautentica por email+senha
 * (mesma checagem do login) antes de acionar o mesmo expurgo total usado
 * por DELETE /users/me (ver DeleteUserUseCase/UserRepository.purge).
 */
@Injectable()
export class DeleteAccountByCredentialsUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingPort: HashingPort,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async execute(input: DeleteAccountByCredentialsInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email)
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordMatch = await this.hashingPort.compare(
      input.password,
      user.password,
    )
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials')

    await this.deleteUserUseCase.execute({ id: user.id.toValue() })
  }
}
