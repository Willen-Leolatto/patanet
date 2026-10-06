import { Report } from '../entities/report'

export abstract class ReportRepository {
  abstract findById(id: string): Promise<Report | null>
  abstract findByReporter(
    reporterId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: Report[]; total: number }>
  abstract findAll(params: {
    page: number
    perPage: number
  }): Promise<{ items: Report[]; total: number }>
  abstract save(report: Report): Promise<void>
}
