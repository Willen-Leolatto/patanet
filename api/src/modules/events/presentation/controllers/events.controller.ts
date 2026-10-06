import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import { Public } from '@shared/presentation/decorators/public.decorator'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { StoragePort } from '@shared/application/ports/storage.port'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { CreateEventDto } from '../dtos/create-event.dto'
import { UpdateEventDto } from '../dtos/update-event.dto'
import { RegisterAdoptableAnimalDto } from '../dtos/register-adoptable-animal.dto'
import { TransferAdoptionTutorshipDto } from '../dtos/transfer-adoption-tutorship.dto'
import { ResponseEventDto } from '../dtos/response-event.dto'
import { ResponseEventAttendeeDto } from '../dtos/response-event-attendee.dto'
import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case'
import { ListEventsUseCase } from '../../application/use-cases/list-events.use-case'
import { UpdateEventUseCase } from '../../application/use-cases/update-event.use-case'
import { RepostEventUseCase } from '../../application/use-cases/repost-event.use-case'
import { DeleteEventUseCase } from '../../application/use-cases/delete-event.use-case'
import { AttendEventUseCase } from '../../application/use-cases/attend-event.use-case'
import { CancelEventAttendanceUseCase } from '../../application/use-cases/cancel-event-attendance.use-case'
import { ListEventAttendeesUseCase } from '../../application/use-cases/list-event-attendees.use-case'
import { RegisterAdoptableAnimalUseCase } from '../../application/use-cases/register-adoptable-animal.use-case'
import { TransferAdoptionTutorshipUseCase } from '../../application/use-cases/transfer-adoption-tutorship.use-case'
import { EventRepository } from '../../domain/repositories/event.repository'
import { EventAttendanceRepository } from '../../domain/repositories/event-attendance.repository'

type EventFiles = { image?: Express.Multer.File[] }

@Controller('events')
export class EventsController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly listEventsUseCase: ListEventsUseCase,
    private readonly updateEventUseCase: UpdateEventUseCase,
    private readonly repostEventUseCase: RepostEventUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    private readonly attendEventUseCase: AttendEventUseCase,
    private readonly cancelEventAttendanceUseCase: CancelEventAttendanceUseCase,
    private readonly listEventAttendeesUseCase: ListEventAttendeesUseCase,
    private readonly registerAdoptableAnimalUseCase: RegisterAdoptableAnimalUseCase,
    private readonly transferAdoptionTutorshipUseCase: TransferAdoptionTutorshipUseCase,
    private readonly eventRepository: EventRepository,
    private readonly eventAttendanceRepository: EventAttendanceRepository,
    private readonly storagePort: StoragePort,
  ) {}

  @Public()
  @Get()
  async list(@Query() pagination: RequestPaginationDto) {
    const { page = 1, perPage = 10 } = pagination
    const { items, total } = await this.listEventsUseCase.execute({
      page,
      perPage,
    })
    const attendeesCounts = await this.eventAttendanceRepository.countByEvents(
      items.map(e => e.id.toValue()),
    )
    const data = items.map(
      e =>
        new ResponseEventDto(e, {
          attendeesCount: attendeesCounts[e.id.toValue()] ?? 0,
        }),
    )
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventRepository.findById(id)
    if (!event) throw new NotFoundException('Event not found')
    const attendeesCount = await this.eventAttendanceRepository.countByEvent(
      id,
    )
    return new ResponseEventDto(event, { attendeesCount })
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async create(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files: EventFiles,
    @Body() dto: CreateEventDto,
  ) {
    let imageUrl: string | undefined
    if (files?.image?.[0]) {
      const { url } = await this.storagePort.upload(files.image[0])
      imageUrl = url
    }

    const event = await this.createEventUseCase.execute({
      authorId: req.user.id,
      title: dto.title,
      description: dto.description,
      date: dto.date,
      time: dto.time,
      locationText: dto.locationText,
      latitude: dto.latitude,
      longitude: dto.longitude,
      imageUrl,
      capacity: dto.capacity,
    })

    return new ResponseEventDto(event, { attendeesCount: 0 })
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFiles() files: EventFiles,
    @Body() dto: UpdateEventDto,
  ) {
    let imageUrl: string | undefined
    if (files?.image?.[0]) {
      const { url } = await this.storagePort.upload(files.image[0])
      imageUrl = url
    }

    const event = await this.updateEventUseCase.execute({
      requesterId: req.user.id,
      eventId: id,
      title: dto.title,
      description: dto.description,
      date: dto.date,
      time: dto.time,
      locationText: dto.locationText,
      latitude: dto.latitude,
      longitude: dto.longitude,
      imageUrl,
      capacity: dto.capacity,
    })

    const attendeesCount = await this.eventAttendanceRepository.countByEvent(
      id,
    )
    return new ResponseEventDto(event, { attendeesCount })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.deleteEventUseCase.execute({
      requesterId: req.user.id,
      eventId: id,
    })
    return { ok: true }
  }

  @Post(':id/repost')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async repost(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const event = await this.repostEventUseCase.execute({
      requesterId: req.user.id,
      eventId: id,
    })
    const attendeesCount = await this.eventAttendanceRepository.countByEvent(
      id,
    )
    return new ResponseEventDto(event, { attendeesCount })
  }

  @Public()
  @Get(':id/attendees')
  async listAttendees(
    @Param('id') id: string,
    @Query() pagination: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = pagination
    const { items, total } = await this.listEventAttendeesUseCase.execute({
      eventId: id,
      page,
      perPage,
    })
    const data = items.map(u => new ResponseEventAttendeeDto(u))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Get(':id/attend')
  @UseGuards(AuthGuard)
  async myAttendance(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const attendance =
      await this.eventAttendanceRepository.findByEventAndUser(
        id,
        req.user.id,
      )
    return { attending: Boolean(attendance) }
  }

  @Post(':id/attend')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async attend(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.attendEventUseCase.execute({
      eventId: id,
      userId: req.user.id,
    })
  }

  @Delete(':id/attend')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async cancelAttend(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.cancelEventAttendanceUseCase.execute({
      eventId: id,
      userId: req.user.id,
    })
  }

  // Instituicoes cadastram, no proprio evento de adocao, quais pets sem
  // dono estao disponiveis. Ver RegisterAdoptableAnimalUseCase -- restrito
  // ao autor do evento e a usuarios com role INSTITUTION.
  @Post(':id/adoptable-animals')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async registerAdoptableAnimal(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RegisterAdoptableAnimalDto,
  ) {
    await this.registerAdoptableAnimalUseCase.execute({
      eventId: id,
      animalId: dto.animalId,
      requesterId: req.user.id,
    })
    return { ok: true }
  }

  // A instituicao confirma a adocao de um pet listado no evento,
  // transferindo a tutoria para o novo dono.
  @Post(':id/adoptable-animals/:animalId/transfer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async transferAdoptionTutorship(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('animalId') animalId: string,
    @Body() dto: TransferAdoptionTutorshipDto,
  ) {
    await this.transferAdoptionTutorshipUseCase.execute({
      eventId: id,
      animalId,
      newOwnerId: dto.newOwnerId,
      requesterId: req.user.id,
    })
    return { ok: true }
  }
}
