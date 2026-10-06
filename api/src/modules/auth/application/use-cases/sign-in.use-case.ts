import { Injectable, UnauthorizedException } from '@nestjs/common'
import { HashingPort } from '@shared/application/ports/hashing.port'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { TokenGeneratorPort } from '../ports/token-generator.port'

export interface SignInInput {
  username: string
  password: string
}

export interface SignInOutput {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class SignInUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingPort: HashingPort,
    private readonly tokenGenerator: TokenGeneratorPort,
  ) {}

  async execute(input: SignInInput): Promise<SignInOutput> {
    const user =
      (await this.userRepository.findByUsername(input.username)) ??
      (await this.userRepository.findByEmail(input.username))
    if (!user) throw new UnauthorizedException('Invalid credentials')

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordMatch = await this.hashingPort.compare(
      input.password,
      user.password,
    )
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials')

    // DELETE /users/me agora e expurgo total (ver DeleteUserUseCase) -- nao
    // sobra conta inativa pra reativar. isActive=false so acontece por
    // suspensao administrativa, que nao deve permitir login.
    if (!user.isActive) throw new UnauthorizedException('Invalid credentials')

    const payload = { sub: user.id.toValue() }
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenGenerator.generateAccessToken(payload),
      this.tokenGenerator.generateRefreshToken(payload),
    ])
    return { accessToken, refreshToken }
  }
}
