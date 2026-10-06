import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import {
  Report,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '@modules/reports/domain/entities/report'
import { Report as PrismaReport, Prisma } from '@prisma/client'

export class ReportMapper {
  static toDomain(row: PrismaReport): Report {
    return Report.reconstitute(
      {
        reporterId: row.reporterId,
        type: row.type as unknown as ReportType,
        category: row.category as unknown as ReportCategory,
        targetId: row.targetId,
        message: row.message,
        attachments: (row.attachments as string[] | null) ?? null,
        status: row.status as unknown as ReportStatus,
        dispatchedAt: row.dispatchedAt,
        dispatchChannel: row.dispatchChannel,
        dispatchReference: row.dispatchReference,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Report) {
    return {
      id: domain.id.toValue(),
      reporterId: domain.reporterId,
      type: domain.type as unknown as PrismaReport['type'],
      category: domain.category as unknown as PrismaReport['category'],
      targetId: domain.targetId,
      message: domain.message,
      attachments: domain.attachments ?? Prisma.DbNull,
      status: domain.status as unknown as PrismaReport['status'],
      dispatchedAt: domain.dispatchedAt,
      dispatchChannel: domain.dispatchChannel,
      dispatchReference: domain.dispatchReference,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
