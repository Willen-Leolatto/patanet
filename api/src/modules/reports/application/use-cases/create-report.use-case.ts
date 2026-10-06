import { Injectable } from '@nestjs/common'
import {
  Report,
  ReportCategory,
  ReportType,
} from '../../domain/entities/report'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { ReportDispatchPort } from '../ports/report-dispatch.port'

export interface CreateReportInput {
  reporterId: string
  type: ReportType
  category: ReportCategory
  targetId: string
  message: string
  attachments?: string[] | null
}

// Categorias que acionam a camada de despacho a orgaos publicos
// competentes (ver ReportDispatchPort) logo na criacao, sem esperar
// triagem manual de um admin -- CSAE e maus-tratos sao urgentes.
const DISPATCHABLE_CATEGORIES: ReportCategory[] = [
  ReportCategory.CSAE,
  ReportCategory.PET_ABUSE,
]

@Injectable()
export class CreateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly reportDispatchPort: ReportDispatchPort,
  ) {}

  async execute(input: CreateReportInput): Promise<Report> {
    const report = Report.create({
      reporterId: input.reporterId,
      type: input.type,
      category: input.category,
      targetId: input.targetId,
      message: input.message,
      attachments: input.attachments ?? null,
    })
    await this.reportRepository.save(report)

    if (DISPATCHABLE_CATEGORIES.includes(input.category)) {
      const result = await this.reportDispatchPort.dispatch(report)
      report.markDispatched(result.channel, result.reference)
      await this.reportRepository.save(report)
    }

    return report
  }
}
