import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { UsersModule } from '../users/users.module'
import { SupportTicketRepository } from './domain/repositories/support-ticket.repository'
import { SupportTicketMessageRepository } from './domain/repositories/support-ticket-message.repository'
import { PrismaSupportTicketRepository } from './infrastructure/persistence/prisma/repositories/prisma-support-ticket.repository'
import { PrismaSupportTicketMessageRepository } from './infrastructure/persistence/prisma/repositories/prisma-support-ticket-message.repository'
import { CreateTicketUseCase } from './application/use-cases/create-ticket.use-case'
import { SendMessageUseCase } from './application/use-cases/send-message.use-case'
import { UpdateTicketStatusUseCase } from './application/use-cases/update-ticket-status.use-case'
import { ListMyTicketsUseCase } from './application/use-cases/list-my-tickets.use-case'
import { ListAllTicketsUseCase } from './application/use-cases/list-all-tickets.use-case'
import { SupportController } from './presentation/controllers/support.controller'

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [SupportController],
  providers: [
    {
      provide: SupportTicketRepository,
      useClass: PrismaSupportTicketRepository,
    },
    {
      provide: SupportTicketMessageRepository,
      useClass: PrismaSupportTicketMessageRepository,
    },
    CreateTicketUseCase,
    SendMessageUseCase,
    UpdateTicketStatusUseCase,
    ListMyTicketsUseCase,
    ListAllTicketsUseCase,
  ],
})
export class SupportModule {}
