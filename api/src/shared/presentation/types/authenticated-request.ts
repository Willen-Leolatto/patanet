import type { Request } from 'express'

export interface AuthUser {
  id: string
  email: string
  termsAcceptedAt: Date | null
  termsVersion: string | null
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser
}
