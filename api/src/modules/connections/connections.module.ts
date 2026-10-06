import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConnectionRepository } from './domain/repositories/connection.repository'
import { PrismaConnectionRepository } from './infrastructure/persistence/prisma/repositories/prisma-connection.repository'
import { FollowUseCase } from './application/use-cases/follow.use-case'
import { UnfollowUseCase } from './application/use-cases/unfollow.use-case'
import { ListFollowersUseCase } from './application/use-cases/list-followers.use-case'
import { ListFollowingUseCase } from './application/use-cases/list-following.use-case'
import { GetConnectionSummaryUseCase } from './application/use-cases/get-connection-summary.use-case'
import { ConnectionsController } from './presentation/controllers/connections.controller'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [ConnectionsController],
  providers: [
    { provide: ConnectionRepository, useClass: PrismaConnectionRepository },
    FollowUseCase,
    UnfollowUseCase,
    ListFollowersUseCase,
    ListFollowingUseCase,
    GetConnectionSummaryUseCase,
  ],
  exports: [ConnectionRepository, GetConnectionSummaryUseCase],
})
export class ConnectionsModule {}
