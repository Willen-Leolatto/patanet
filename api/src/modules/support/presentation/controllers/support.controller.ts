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
import { CreateTicketUseCase } from '../../application/use-cases/create-ticket.use-case'
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case'
import { UpdateTicketStatusUseCase } from '../../application/use-cases/update-ticket-status.use-case'
import { ListMyTicketsUseCase } from '../../application/use-cases/list-my-tickets.use-case'
import { ListAllTicketsUseCase } from '../../application/use-cases/list-all-tickets.use-case'
import { CreateTicketDto } from '../dtos/create-ticket.dto'
import { SendMessageDto } from '../dtos/send-message.dto'
import { UpdateTicketStatusDto } from '../dtos/update-ticket-status.dto'
import { ResponseTicketDto } from '../dtos/response-ticket.dto'

@UseGuards(AuthGuard)
@Controller('support')
export class SupportController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly updateTicketStatusUseCase: UpdateTicketStatusUseCase,
    private readonly listMyTicketsUseCase: ListMyTicketsUseCase,
    private readonly listAllTicketsUseCase: ListAllTicketsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    const ticket = await this.createTicketUseCase.execute({
      authorId: req.user.id,
      category: dto.category,
      subject: dto.subject,
      message: dto.message,
      attachments: dto.attachments ?? null,
    })
    return new ResponseTicketDto(ticket)
  }

  @Get('mine')
  async mine(
    @Req() req: AuthenticatedRequest,
    @Query() q: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = q
    const { items, total } = await this.listMyTicketsUseCase.execute({
      authorId: req.user.id,
      page,
      perPage,
    })
    const data = items.map(t => new ResponseTicketDto(t))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Get('all')
  @UseGuards(AdminGuard)
  async all(@Query() q: RequestPaginationDto) {
    const { page = 1, perPage = 10 } = q
    const { items, total } = await this.listAllTicketsUseCase.execute({
      page,
      perPage,
    })
    const data = items.map(t => new ResponseTicketDto(t))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    await this.sendMessageUseCase.execute({
      authorId: req.user.id,
      ticketId: id,
      message: dto.message,
      attachments: dto.attachments ?? null,
    })
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    const ticket = await this.updateTicketStatusUseCase.execute({
      ticketId: id,
      status: dto.status,
    })
    return new ResponseTicketDto(ticket)
  }
}
