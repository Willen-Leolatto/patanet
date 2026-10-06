import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { EnvService } from 'src/env/env.service'
import type { AuthenticatedRequest } from '../types/authenticated-request'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { SKIP_TERMS_CHECK_KEY } from '../decorators/skip-terms-check.decorator'

/**
 * Conformidade LGPD/Marco Civil: bloqueia rotas privadas com 403 enquanto o
 * usuario nao tiver aceitado a versao vigente dos Termos de Uso. Global
 * (APP_GUARD) -- roda depois do AuthGuard, que ja populou req.user com
 * termsAcceptedAt/termsVersion (sem SELECT adicional).
 */
@Injectable()
export class TermsAcceptedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly envService: EnvService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (isPublic) return true

    const skipTermsCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TERMS_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (skipTermsCheck) return true

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>()

    const currentVersion = this.envService.get('CURRENT_TERMS_VERSION')
    if (request.user?.termsVersion !== currentVersion) {
      throw new ForbiddenException('Termos de uso desatualizados')
    }

    return true
  }
}
