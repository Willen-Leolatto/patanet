import { Body, Controller, Post, Req } from '@nestjs/common'
import type { Request } from 'express'
import { Public } from '@shared/presentation/decorators/public.decorator'
import { SignInUseCase } from '../../application/use-cases/sign-in.use-case'
import { SignInWithGoogleUseCase } from '../../application/use-cases/sign-in-with-google.use-case'
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case'
import { SignInDto } from '../dtos/sign-in.dto'
import { GoogleSignInDto } from '../dtos/google-sign-in.dto'
import { ResponseJwtDto } from '../dtos/response-jwt.dto'

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signInUseCase: SignInUseCase,
    private readonly signInWithGoogleUseCase: SignInWithGoogleUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('session')
  async signIn(@Body() dto: SignInDto) {
    const { accessToken, refreshToken } = await this.signInUseCase.execute(dto)
    return new ResponseJwtDto(accessToken, refreshToken)
  }

  @Post('google')
  async signInWithGoogle(@Body() dto: GoogleSignInDto) {
    const { accessToken, refreshToken } =
      await this.signInWithGoogleUseCase.execute(dto)
    return new ResponseJwtDto(accessToken, refreshToken)
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.headers['refresh-token'] as string | undefined
    const { accessToken, refreshToken: newRefreshToken } =
      await this.refreshTokenUseCase.execute({ refreshToken })
    return new ResponseJwtDto(accessToken, newRefreshToken)
  }
}
