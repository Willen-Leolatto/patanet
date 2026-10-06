import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { EnvModule } from 'src/env/env.module'
import { UsersModule } from '../users/users.module'
import { ReportRepository } from './domain/repositories/report.repository'
import { PrismaReportRepository } from './infrastructure/persistence/prisma/repositories/prisma-report.repository'
import { ReportDispatchPort } from './application/ports/report-dispatch.port'
import { LoggingReportDispatchAdapter } from './infrastructure/dispatch/logging-report-dispatch.adapter'
import { CreateReportUseCase } from './application/use-cases/create-report.use-case'
import { ListMyReportsUseCase } from './application/use-cases/list-my-reports.use-case'
import { UpdateReportStatusUseCase } from './application/use-cases/update-report-status.use-case'
import { ReportsController } from './presentation/controllers/reports.controller'

@Module({
  imports: [JwtModule, UsersModule, EnvModule],
  controllers: [ReportsController],
  providers: [
    { provide: ReportRepository, useClass: PrismaReportRepository },
    { provide: ReportDispatchPort, useClass: LoggingReportDispatchAdapter },
    CreateReportUseCase,
    ListMyReportsUseCase,
    UpdateReportStatusUseCase,
  ],
  exports: [ReportRepository],
})
export class ReportsModule {}
