import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { BlockUserUseCase } from '../../application/use-cases/block-user.use-case'
import { UnblockUserUseCase } from '../../application/use-cases/unblock-user.use-case'
import { ListBlocksUseCase } from '../../application/use-cases/list-blocks.use-case'
import { ResponseBlockDto } from '../dtos/response-block.dto'

@UseGuards(AuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(
    private readonly blockUserUseCase: BlockUserUseCase,
    private readonly unblockUserUseCase: UnblockUserUseCase,
    private readonly listBlocksUseCase: ListBlocksUseCase,
  ) {}

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  async block(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.blockUserUseCase.execute({
      blockerId: req.user.id,
      blockedId: id,
    })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async unblock(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.unblockUserUseCase.execute({
      blockerId: req.user.id,
      blockedId: id,
    })
  }

  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = pagination
    const { items, total } = await this.listBlocksUseCase.execute({
      blockerId: req.user.id,
      page,
      perPage,
    })
    const data = items.map(b => new ResponseBlockDto(b))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }
}
