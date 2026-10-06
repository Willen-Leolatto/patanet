import { IsEnum } from 'class-validator'
import { ReportStatus } from '../../domain/entities/report'

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus
}
