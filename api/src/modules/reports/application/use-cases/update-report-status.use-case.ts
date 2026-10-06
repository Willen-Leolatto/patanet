import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Report, ReportStatus } from '../../domain/entities/report'
import { ReportRepository } from '../../domain/repositories/report.repository'

export interface UpdateReportStatusInput {
  reportId: string
  status: ReportStatus
}

@Injectable()
export class UpdateReportStatusUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute(input: UpdateReportStatusInput): Promise<Report> {
    const report = await this.reportRepository.findById(input.reportId)
    if (!report) {
      throw new NotFoundException('Report not found')
    }
    if (!report.canTransitionTo(input.status)) {
      throw new BadRequestException(
        `Não é possível mudar o status de ${report.status} para ${input.status}`,
      )
    }
    report.updateStatus(input.status)
    await this.reportRepository.save(report)
    return report
  }
}
