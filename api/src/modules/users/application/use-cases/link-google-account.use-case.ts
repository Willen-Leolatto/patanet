import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { GoogleTokenVerifierPort } from '@shared/application/ports/google-token-verifier.port'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface LinkGoogleAccountInput {
  userId: string
  idToken: string
}

@Injectable()
export class LinkGoogleAccountUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly googleTokenVerifier: GoogleTokenVerifierPort,
  ) {}

  async execute(input: LinkGoogleAccountInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) throw new NotFoundException('User not found')

    const googlePayload = await this.googleTokenVerifier.verify(input.idToken)

    if (googlePayload.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ConflictException(
        'The Google account email does not match your account email',
      )
    }
    if (!googlePayload.emailVerified) {
      throw new UnauthorizedException('Google email is not verified')
    }

    const alreadyLinkedTo = await this.userRepository.findByGoogleId(
      googlePayload.googleId,
    )
    if (alreadyLinkedTo && alreadyLinkedTo.id.toValue() !== user.id.toValue()) {
      throw new ConflictException(
        'This Google account is already linked to another user',
      )
    }

    user.linkGoogle(googlePayload.googleId)
    await this.userRepository.save(user)
  }
}
