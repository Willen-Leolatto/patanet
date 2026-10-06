import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { ToggleVisibilityUseCase } from '../../application/use-cases/toggle-visibility.use-case'

@UseGuards(AuthGuard)
@Controller('animals')
export class HidePetsController {
  constructor(
    private readonly toggleVisibilityUseCase: ToggleVisibilityUseCase,
  ) {}

  @Post(':animalId/hide')
  @HttpCode(HttpStatus.OK)
  async hide(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
  ) {
    await this.toggleVisibilityUseCase.execute({
      animalId,
      userId: req.user.id,
      hidden: true,
    })
    return { ok: true }
  }

  @Post(':animalId/unhide')
  @HttpCode(HttpStatus.OK)
  async unhide(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
  ) {
    await this.toggleVisibilityUseCase.execute({
      animalId,
      userId: req.user.id,
      hidden: false,
    })
    return { ok: true }
  }
}
