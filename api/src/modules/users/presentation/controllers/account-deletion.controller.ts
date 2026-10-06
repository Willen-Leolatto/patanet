import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { Public } from '@shared/presentation/decorators/public.decorator'
import { DeleteAccountByCredentialsUseCase } from '../../application/use-cases/delete-account-by-credentials.use-case'
import { DeleteAccountDto } from '../dtos/delete-account.dto'

/**
 * Rota publica web exigida pela politica de exclusao de conta da Play
 * Store (PLAY_STORE_ACCOUNT_DELETION_URL, ver .env) -- sem prefixo /users
 * de proposito, pra bater com o link divulgado fora do app.
 */
@Public()
@Controller()
export class AccountDeletionController {
  constructor(
    private readonly deleteAccountByCredentialsUseCase: DeleteAccountByCredentialsUseCase,
  ) {}

  @Post('delete-account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Body() dto: DeleteAccountDto) {
    await this.deleteAccountByCredentialsUseCase.execute(dto)
    return { ok: true }
  }
}
