import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { EnvModule } from 'src/env/env.module'
import { EnvService } from 'src/env/env.service'
import { UsersModule } from '@modules/users/users.module'
import { TokenGeneratorPort } from './application/ports/token-generator.port'
import { JwtTokenGeneratorAdapter } from './infrastructure/jwt/jwt-token-generator.adapter'
import { SignInUseCase } from './application/use-cases/sign-in.use-case'
import { SignInWithGoogleUseCase } from './application/use-cases/sign-in-with-google.use-case'
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case'
import { AuthController } from './presentation/controllers/auth.controller'

@Module({
  imports: [
    EnvModule,
    UsersModule,
    JwtModule.registerAsync({
      global: true,
      imports: [EnvModule],
      inject: [EnvService],
      useFactory(env: EnvService) {
        return { secret: env.get('JWT_SECRET') }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: TokenGeneratorPort, useClass: JwtTokenGeneratorAdapter },
    SignInUseCase,
    SignInWithGoogleUseCase,
    RefreshTokenUseCase,
  ],
})
export class AuthModule {}
