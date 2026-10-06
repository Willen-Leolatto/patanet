import { SetMetadata } from '@nestjs/common'

export const SKIP_TERMS_CHECK_KEY = 'skipTermsCheck'

/**
 * Marca uma rota autenticada como isenta do TermsAcceptedGuard -- usado no
 * proprio endpoint de aceite dos termos (senao o usuario fica preso num
 * loop: bloqueado por termos pendentes, sem conseguir chamar a rota que
 * aceita os termos) e em rotas que precisam funcionar mesmo com termos
 * pendentes (perfil, exclusao de conta).
 */
export const SkipTermsCheck = () => SetMetadata(SKIP_TERMS_CHECK_KEY, true)
