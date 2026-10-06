import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Report } from '@modules/reports/domain/entities/report'
import { ReportRepository } from '@modules/reports/domain/repositories/report.repository'
import { ReportMapper } from '../mappers/report.mapper'

@Injectable()
export class PrismaReportRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Report | null> {
    const row = await this.prisma.report.findUnique({ where: { id } })
    return row ? ReportMapper.toDomain(row) : null
  }

  async findByReporter(
    reporterId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: Report[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { reporterId },
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.report.count({ where: { reporterId } }),
    ])
    return { items: rows.map(row => ReportMapper.toDomain(row)), total }
  }

  async findAll(params: {
    page: number
    perPage: number
  }): Promise<{ items: Report[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.report.count(),
    ])
    return { items: rows.map(row => ReportMapper.toDomain(row)), total }
  }

  async save(report: Report): Promise<void> {
    const data = ReportMapper.toPersistence(report)
    const exists = await this.prisma.report.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.report.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.report.create({ data })
    }
  }
}
