import {
  Report,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../domain/entities/report'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { ListMyReportsUseCase } from './list-my-reports.use-case'

const mockReportRepo = (): jest.Mocked<ReportRepository> => ({
  findById: jest.fn(),
  findByReporter: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
})

function makeReport(reporterId: string) {
  return Report.reconstitute(
    {
      reporterId,
      type: ReportType.USER,
      category: ReportCategory.GENERAL,
      targetId: 'target-1',
      message: 'Test report',
      attachments: null,
      status: ReportStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(),
  )
}

describe('ListMyReportsUseCase', () => {
  let useCase: ListMyReportsUseCase
  let reportRepo: jest.Mocked<ReportRepository>

  beforeEach(() => {
    reportRepo = mockReportRepo()
    useCase = new ListMyReportsUseCase(reportRepo)
  })

  it('returns only reports belonging to the requesting user', async () => {
    const userReport = makeReport('user-1')
    reportRepo.findByReporter.mockResolvedValue({
      items: [userReport],
      total: 1,
    })

    const result = await useCase.execute({
      reporterId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(reportRepo.findByReporter).toHaveBeenCalledWith('user-1', {
      page: 1,
      perPage: 10,
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].reporterId).toBe('user-1')
    expect(result.total).toBe(1)
  })

  it('returns empty list when user has no reports', async () => {
    reportRepo.findByReporter.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({
      reporterId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('passes pagination params to repository', async () => {
    reportRepo.findByReporter.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ reporterId: 'user-1', page: 2, perPage: 5 })

    expect(reportRepo.findByReporter).toHaveBeenCalledWith('user-1', {
      page: 2,
      perPage: 5,
    })
  })

  it('does not return reports from other users', async () => {
    const otherUserReport = makeReport('user-2')
    reportRepo.findByReporter.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({
      reporterId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(result.items).not.toContain(otherUserReport)
    expect(result.items).toHaveLength(0)
  })
})
