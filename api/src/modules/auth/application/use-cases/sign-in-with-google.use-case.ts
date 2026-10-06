import { Injectable, UnauthorizedException } from '@nestjs/common'
import { GoogleTokenVerifierPort } from '@shared/application/ports/google-token-verifier.port'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { User } from '@modules/users/domain/entities/user'
import { TokenGeneratorPort } from '../ports/token-generator.port'

export interface SignInWithGoogleInput {
  idToken: string
}

export interface SignInWithGoogleOutput {
  accessToken: string
  refreshToken: string
}

interface GoogleProfile {
  googleId: string
  email: string
  name: string | null
  picture: string | null
}

@Injectable()
export class SignInWithGoogleUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly googleTokenVerifier: GoogleTokenVerifierPort,
    private readonly tokenGenerator: TokenGeneratorPort,
  ) {}

  async execute(input: SignInWithGoogleInput): Promise<SignInWithGoogleOutput> {
    const googlePayload = await this.googleTokenVerifier.verify(input.idToken)

    let user = await this.userRepository.findByGoogleId(googlePayload.googleId)

    if (!user) {
      const existingByEmail = await this.userRepository.findByEmail(
        googlePayload.email,
      )

      if (existingByEmail) {
        if (!googlePayload.emailVerified) {
          throw new UnauthorizedException('Google email is not verified')
        }
        existingByEmail.linkGoogle(googlePayload.googleId)
        await this.userRepository.save(existingByEmail)
        user = existingByEmail
      } else {
        user = await this.createUserFromGoogle(googlePayload)
      }
    }

    // Mesma regra do login por senha (ver SignInUseCase): sem reativacao,
    // isActive=false so acontece por suspensao administrativa.
    if (!user.isActive) throw new UnauthorizedException('Account is inactive')

    const payload = { sub: user.id.toValue() }
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenGenerator.generateAccessToken(payload),
      this.tokenGenerator.generateRefreshToken(payload),
    ])
    return { accessToken, refreshToken }
  }

  private async createUserFromGoogle(
    googlePayload: GoogleProfile,
  ): Promise<User> {
    const username = await this.generateUniqueUsername(googlePayload.email)

    const user = User.create({
      name: googlePayload.name ?? googlePayload.email.split('@')[0],
      username,
      email: googlePayload.email,
      password: null,
      googleId: googlePayload.googleId,
      image: googlePayload.picture,
      displayName: null,
      about: null,
      imageCover: null,
    })

    await this.userRepository.save(user)
    return user
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20) || 'user'

    let candidate = base
    let suffix = 0

    while (await this.userRepository.findByUsername(candidate)) {
      suffix += 1
      candidate = `${base}${suffix}`
    }

    return candidate
  }
}
