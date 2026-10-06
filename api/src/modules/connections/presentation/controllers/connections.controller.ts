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
import { FollowUseCase } from '../../application/use-cases/follow.use-case'
import { UnfollowUseCase } from '../../application/use-cases/unfollow.use-case'
import { ListFollowersUseCase } from '../../application/use-cases/list-followers.use-case'
import { ListFollowingUseCase } from '../../application/use-cases/list-following.use-case'
import { GetConnectionSummaryUseCase } from '../../application/use-cases/get-connection-summary.use-case'
import { ResponseUserDto } from '@modules/users/presentation/dtos/response-user.dto'

@UseGuards(AuthGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(
    private readonly followUseCase: FollowUseCase,
    private readonly unfollowUseCase: UnfollowUseCase,
    private readonly listFollowersUseCase: ListFollowersUseCase,
    private readonly listFollowingUseCase: ListFollowingUseCase,
    private readonly getConnectionSummaryUseCase: GetConnectionSummaryUseCase,
  ) {}

  @Post(['follow/:id', ':id'])
  @HttpCode(HttpStatus.CREATED)
  async follow(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.followUseCase.execute({
      followerId: req.user.id,
      followingId: id,
    })
    return { success: true }
  }

  @Delete(['unfollow/:id', ':id'])
  @HttpCode(HttpStatus.OK)
  async unfollow(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.unfollowUseCase.execute({
      followerId: req.user.id,
      followingId: id,
    })
    return { success: true }
  }

  @Get('followers/:id')
  async followers(
    @Param('id') id: string,
    @Query() pagination: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = pagination
    const { items, total } = await this.listFollowersUseCase.execute({
      userId: id,
      page,
      perPage,
    })
    const data = items.map(u => new ResponseUserDto(u))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Get(['following/:id', 'followeds/:id'])
  async following(
    @Param('id') id: string,
    @Query() pagination: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = pagination
    const { items, total } = await this.listFollowingUseCase.execute({
      userId: id,
      page,
      perPage,
    })
    const data = items.map(u => new ResponseUserDto(u))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Get('summary/:id')
  async summary(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.getConnectionSummaryUseCase.execute({
      userId: id,
      currentUserId: req.user.id,
    })
  }
}
