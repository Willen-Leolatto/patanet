import {
  Report,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '../../domain/entities/report'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { ReportDispatchPort } from '../ports/report-dispatch.port'
import { CreateReportUseCase } from './create-report.use-case'

const mockReportRepo = (): jest.Mocked<ReportRepository> => ({
  findById: jest.fn(),
  findByReporter: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
})

const mockDispatchPort = (): jest.Mocked<ReportDispatchPort> => ({
  dispatch: jest.fn(),
})

describe('CreateReportUseCase', () => {
  let useCase: CreateReportUseCase
  let reportRepo: jest.Mocked<ReportRepository>
  let dispatchPort: jest.Mocked<ReportDispatchPort>

  beforeEach(() => {
    reportRepo = mockReportRepo()
    dispatchPort = mockDispatchPort()
    useCase = new CreateReportUseCase(reportRepo, dispatchPort)
  })

  const validInput = {
    reporterId: 'user-1',
    type: ReportType.USER,
    category: ReportCategory.GENERAL,
    targetId: 'target-1',
    message: 'Inappropriate content',
  }

  it('creates and saves a report on happy path', async () => {
    reportRepo.save.mockResolvedValue()

    const report = await useCase.execute(validInput)

    expect(reportRepo.save).toHaveBeenCalledTimes(1)
    expect(report).toBeInstanceOf(Report)
    expect(report.reporterId).toBe('user-1')
    expect(report.type).toBe(ReportType.USER)
    expect(report.category).toBe(ReportCategory.GENERAL)
    expect(report.targetId).toBe('target-1')
    expect(report.message).toBe('Inappropriate content')
    expect(report.status).toBe(ReportStatus.OPEN)
    expect(report.attachments).toBeNull()
    expect(dispatchPort.dispatch).not.toHaveBeenCalled()
  })

  it('creates a report with attachments', async () => {
    reportRepo.save.mockResolvedValue()

    const report = await useCase.execute({
      ...validInput,
      attachments: ['https://example.com/file1.jpg'],
    })

    expect(report.attachments).toEqual(['https://example.com/file1.jpg'])
  })

  it('sets attachments to null when not provided', async () => {
    reportRepo.save.mockResolvedValue()

    const report = await useCase.execute(validInput)

    expect(report.attachments).toBeNull()
  })

  it('passes the saved report to repository', async () => {
    reportRepo.save.mockResolvedValue()

    await useCase.execute(validInput)

    const saved = reportRepo.save.mock.calls[0][0]
    expect(saved.reporterId).toBe('user-1')
    expect(saved.status).toBe(ReportStatus.OPEN)
  })

  it('dispatches to the public authority channel for PET_ABUSE reports', async () => {
    reportRepo.save.mockResolvedValue()
    dispatchPort.dispatch.mockResolvedValue({
      channel: 'webhook+log',
      reference: 'ref-123',
    })

    const report = await useCase.execute({
      ...validInput,
      category: ReportCategory.PET_ABUSE,
    })

    expect(dispatchPort.dispatch).toHaveBeenCalledTimes(1)
    expect(reportRepo.save).toHaveBeenCalledTimes(2)
    expect(report.dispatchedAt).not.toBeNull()
    expect(report.dispatchChannel).toBe('webhook+log')
    expect(report.dispatchReference).toBe('ref-123')
  })

  it('dispatches to the public authority channel for CSAE reports', async () => {
    reportRepo.save.mockResolvedValue()
    dispatchPort.dispatch.mockResolvedValue({
      channel: 'log',
      reference: null,
    })

    const report = await useCase.execute({
      ...validInput,
      category: ReportCategory.CSAE,
    })

    expect(dispatchPort.dispatch).toHaveBeenCalledTimes(1)
    expect(report.dispatchedAt).not.toBeNull()
  })
})
