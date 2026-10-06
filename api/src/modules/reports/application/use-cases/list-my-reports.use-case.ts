import { Injectable } from '@nestjs/common'
import { Report } from '../../domain/entities/report'
import { ReportRepository } from '../../domain/repositories/report.repository'

export interface ListMyReportsInput {
  reporterId: string
  page: number
  perPage: number
}

export interface ListMyReportsOutput {
  items: Report[]
  total: number
}

@Injectable()
export class ListMyReportsUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute(input: ListMyReportsInput): Promise<ListMyReportsOutput> {
    return this.reportRepository.findByReporter(input.reporterId, {
      page: input.page,
      perPage: input.perPage,
    })
  }
}
