import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (isPublic) return true

    const request: Request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token) throw new UnauthorizedException()
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token)
      const user = await this.userRepository.findById(payload.sub)
      if (!user) throw new UnauthorizedException()
      // Conta desativada (ex.: suspensao administrativa) -- o token antigo
      // continua valido tecnicamente, mas a sessao e recusada. Contas
      // excluidas pelo usuario (DELETE /users/me) nao ficam nesse estado:
      // sao removidas de fato (ver DeleteUserUseCase), entao o findById
      // acima ja retorna null nesse caso.
      if (!user.isActive) throw new UnauthorizedException()
      request['user'] = {
        id: user.id.toValue(),
        email: user.email,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
      }
    } catch {
      throw new UnauthorizedException()
    }
    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
