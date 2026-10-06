import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import { AdminGuard } from '@shared/presentation/guards/admin.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { CreateReportUseCase } from '../../application/use-cases/create-report.use-case'
import { ListMyReportsUseCase } from '../../application/use-cases/list-my-reports.use-case'
import { UpdateReportStatusUseCase } from '../../application/use-cases/update-report-status.use-case'
import { CreateReportDto } from '../dtos/create-report.dto'
import { UpdateReportStatusDto } from '../dtos/update-report-status.dto'
import { ResponseReportDto } from '../dtos/response-report.dto'

@UseGuards(AuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly createReportUseCase: CreateReportUseCase,
    private readonly listMyReportsUseCase: ListMyReportsUseCase,
    private readonly updateReportStatusUseCase: UpdateReportStatusUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReportDto) {
    const report = await this.createReportUseCase.execute({
      reporterId: req.user.id,
      type: dto.type,
      category: dto.category,
      targetId: dto.targetId,
      message: dto.message,
      attachments: dto.attachments ?? null,
    })
    return new ResponseReportDto(report)
  }

  @Get(['mine', 'me'])
  async mine(
    @Req() req: AuthenticatedRequest,
    @Query() q: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = q
    const { items, total } = await this.listMyReportsUseCase.execute({
      reporterId: req.user.id,
      page,
      perPage,
    })
    const data = items.map(r => new ResponseReportDto(r))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    const report = await this.updateReportStatusUseCase.execute({
      reportId: id,
      status: dto.status,
    })
    return new ResponseReportDto(report)
  }
}
