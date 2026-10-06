import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { EventRepository } from './domain/repositories/event.repository'
import { EventAttendanceRepository } from './domain/repositories/event-attendance.repository'
import { PrismaEventRepository } from './infrastructure/persistence/prisma/repositories/prisma-event.repository'
import { PrismaEventAttendanceRepository } from './infrastructure/persistence/prisma/repositories/prisma-event-attendance.repository'
import { CreateEventUseCase } from './application/use-cases/create-event.use-case'
import { ListEventsUseCase } from './application/use-cases/list-events.use-case'
import { UpdateEventUseCase } from './application/use-cases/update-event.use-case'
import { RepostEventUseCase } from './application/use-cases/repost-event.use-case'
import { DeleteEventUseCase } from './application/use-cases/delete-event.use-case'
import { AttendEventUseCase } from './application/use-cases/attend-event.use-case'
import { CancelEventAttendanceUseCase } from './application/use-cases/cancel-event-attendance.use-case'
import { ListEventAttendeesUseCase } from './application/use-cases/list-event-attendees.use-case'
import { RegisterAdoptableAnimalUseCase } from './application/use-cases/register-adoptable-animal.use-case'
import { TransferAdoptionTutorshipUseCase } from './application/use-cases/transfer-adoption-tutorship.use-case'
import { EventsController } from './presentation/controllers/events.controller'
import { PostsModule } from '../posts/posts.module'
import { UsersModule } from '../users/users.module'
import { AnimalsModule } from '../animals/animals.module'

@Module({
  imports: [
    JwtModule,
    PostsModule,
    UsersModule,
    // Necessario para RegisterAdoptableAnimalUseCase e
    // TransferAdoptionTutorshipUseCase (instituicoes vinculando pets sem
    // dono aos seus eventos de adocao). Import direto, sem forwardRef:
    // AnimalsModule nunca importa EventsModule de volta, entao nao ha
    // referencia circular aqui -- diferente do par UsersModule/AnimalsModule.
    AnimalsModule,
  ],
  controllers: [EventsController],
  providers: [
    { provide: EventRepository, useClass: PrismaEventRepository },
    {
      provide: EventAttendanceRepository,
      useClass: PrismaEventAttendanceRepository,
    },
    CreateEventUseCase,
    ListEventsUseCase,
    UpdateEventUseCase,
    RepostEventUseCase,
    DeleteEventUseCase,
    AttendEventUseCase,
    CancelEventAttendanceUseCase,
    ListEventAttendeesUseCase,
    RegisterAdoptableAnimalUseCase,
    TransferAdoptionTutorshipUseCase,
  ],
  exports: [EventRepository],
})
export class EventsModule {}
