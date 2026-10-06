import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common'
import type { AuthenticatedRequest } from '../types/authenticated-request'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const email = (req.user?.email || '').toLowerCase()

    const raw = process.env.ADMIN_EMAILS || ''
    const allowed = raw
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    if (allowed.length === 0) {
      throw new ForbiddenException('AdminGuard: ADMIN_EMAILS not configured')
    }

    if (!allowed.includes(email)) {
      throw new ForbiddenException('Admin only')
    }

    return true
  }
}
