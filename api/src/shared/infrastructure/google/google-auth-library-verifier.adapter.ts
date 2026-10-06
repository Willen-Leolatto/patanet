import { Injectable, UnauthorizedException } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { EnvService } from '../../../env/env.service'
import {
  GoogleTokenPayload,
  GoogleTokenVerifierPort,
} from '../../application/ports/google-token-verifier.port'

@Injectable()
export class GoogleAuthLibraryVerifierAdapter implements GoogleTokenVerifierPort {
  private readonly client: OAuth2Client
  private readonly audiences: string[]

  constructor(private readonly envService: EnvService) {
    this.client = new OAuth2Client()
    this.audiences = [
      this.envService.get('GOOGLE_CLIENT_ID_WEB'),
      this.envService.get('GOOGLE_CLIENT_ID_ANDROID'),
    ].filter((id): id is string => Boolean(id))
  }

  async verify(idToken: string): Promise<GoogleTokenPayload> {
    if (!this.audiences.length) {
      throw new UnauthorizedException('Google sign-in is not configured')
    }

    let ticket
    try {
      ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.audiences,
      })
    } catch {
      throw new UnauthorizedException('Invalid Google token')
    }

    const payload = ticket.getPayload()
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token')
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    }
  }
}
