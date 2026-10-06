import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { UsersModule } from '../users/users.module'
import { BlockRepository } from './domain/repositories/block.repository'
import { PrismaBlockRepository } from './infrastructure/persistence/prisma/repositories/prisma-block.repository'
import { BlockUserUseCase } from './application/use-cases/block-user.use-case'
import { UnblockUserUseCase } from './application/use-cases/unblock-user.use-case'
import { ListBlocksUseCase } from './application/use-cases/list-blocks.use-case'
import { BlocksController } from './presentation/controllers/blocks.controller'

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [BlocksController],
  providers: [
    { provide: BlockRepository, useClass: PrismaBlockRepository },
    BlockUserUseCase,
    UnblockUserUseCase,
    ListBlocksUseCase,
  ],
  exports: [BlockRepository],
})
export class BlocksModule {}
