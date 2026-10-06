import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * Marca uma rota como acessivel sem JWT. Necessario porque AuthGuard virou
 * global (APP_GUARD) -- sem essa marcacao toda rota exigiria autenticacao.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
