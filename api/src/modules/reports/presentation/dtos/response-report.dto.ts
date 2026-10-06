import {
  Report,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../domain/entities/report'

export class ResponseReportDto {
  readonly id: string
  readonly reporterId: string
  readonly type: ReportType
  readonly category: ReportCategory
  readonly targetId: string
  readonly message: string
  readonly attachments: string[] | null
  readonly status: ReportStatus
  readonly dispatchedAt: Date | null
  readonly dispatchChannel: string | null
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(report: Report) {
    this.id = report.id.toValue()
    this.reporterId = report.reporterId
    this.type = report.type
    this.category = report.category
    this.targetId = report.targetId
    this.message = report.message
    this.attachments = report.attachments
    this.status = report.status
    this.dispatchedAt = report.dispatchedAt
    this.dispatchChannel = report.dispatchChannel
    this.createdAt = report.createdAt
    this.updatedAt = report.updatedAt
  }
}
