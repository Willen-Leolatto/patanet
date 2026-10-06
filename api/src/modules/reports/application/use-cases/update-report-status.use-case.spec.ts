import { NotFoundException } from '@nestjs/common'
import {
  Report,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../domain/entities/report'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { UpdateReportStatusUseCase } from './update-report-status.use-case'

const mockReportRepo = (): jest.Mocked<ReportRepository> => ({
  findById: jest.fn(),
  findByReporter: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
})

function makeReport(status = ReportStatus.OPEN) {
  return Report.reconstitute(
    {
      reporterId: 'user-1',
      type: ReportType.USER,
      category: ReportCategory.GENERAL,
      targetId: 'target-1',
      message: 'Test report',
      attachments: null,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('report-1'),
  )
}

describe('UpdateReportStatusUseCase', () => {
  let useCase: UpdateReportStatusUseCase
  let reportRepo: jest.Mocked<ReportRepository>

  beforeEach(() => {
    reportRepo = mockReportRepo()
    useCase = new UpdateReportStatusUseCase(reportRepo)
  })

  it('updates report status on happy path', async () => {
    const report = makeReport()
    reportRepo.findById.mockResolvedValue(report)
    reportRepo.save.mockResolvedValue()

    const result = await useCase.execute({
      reportId: 'report-1',
      status: ReportStatus.RESOLVED,
    })

    expect(reportRepo.findById).toHaveBeenCalledWith('report-1')
    expect(reportRepo.save).toHaveBeenCalledTimes(1)
    expect(result.status).toBe(ReportStatus.RESOLVED)
  })

  it('throws NotFoundException when report does not exist', async () => {
    reportRepo.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({
        reportId: 'nonexistent',
        status: ReportStatus.RESOLVED,
      }),
    ).rejects.toThrow(NotFoundException)

    expect(reportRepo.save).not.toHaveBeenCalled()
  })

  it('updates to IN_REVIEW status', async () => {
    const report = makeReport()
    reportRepo.findById.mockResolvedValue(report)
    reportRepo.save.mockResolvedValue()

    const result = await useCase.execute({
      reportId: 'report-1',
      status: ReportStatus.IN_REVIEW,
    })

    expect(result.status).toBe(ReportStatus.IN_REVIEW)
  })

  it('updates to REJECTED status', async () => {
    const report = makeReport()
    reportRepo.findById.mockResolvedValue(report)
    reportRepo.save.mockResolvedValue()

    const result = await useCase.execute({
      reportId: 'report-1',
      status: ReportStatus.REJECTED,
    })

    expect(result.status).toBe(ReportStatus.REJECTED)
  })
})
