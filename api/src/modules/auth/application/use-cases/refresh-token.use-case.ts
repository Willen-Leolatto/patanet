import { Injectable, UnauthorizedException } from '@nestjs/common'
import { TokenGeneratorPort } from '../ports/token-generator.port'

export interface RefreshTokenInput {
  refreshToken: string | undefined
}

export interface RefreshTokenOutput {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly tokenGenerator: TokenGeneratorPort) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    if (!input.refreshToken) throw new UnauthorizedException()
    const payload = await this.tokenGenerator.verifyRefreshToken(
      input.refreshToken,
    )
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenGenerator.generateAccessToken({ sub: payload.sub }),
      this.tokenGenerator.generateRefreshToken({ sub: payload.sub }),
    ])
    return { accessToken, refreshToken }
  }
}
