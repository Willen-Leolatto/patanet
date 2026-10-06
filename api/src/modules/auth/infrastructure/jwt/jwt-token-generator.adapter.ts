import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TokenGeneratorPort } from '../../application/ports/token-generator.port'

const ACCESS_TOKEN_EXPIRATION = '1h'
const REFRESH_TOKEN_EXPIRATION = '1d'

@Injectable()
export class JwtTokenGeneratorAdapter implements TokenGeneratorPort {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(payload: { sub: string }): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    })
  }

  async generateRefreshToken(payload: { sub: string }): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    })
  }

  async verifyRefreshToken(token: string): Promise<{ sub: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sub: string }>(token)
    } catch {
      throw new UnauthorizedException()
    }
  }
}
