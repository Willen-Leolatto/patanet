import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { ReportRepository } from '@modules/reports/domain/repositories/report.repository'
import {
  Report,
  ReportCategory,
  ReportStatus,
  ReportType,
} from '@modules/reports/domain/entities/report'
import { PrismaReportRepository } from './prisma-report.repository'

describe('PrismaReportRepository (integration)', () => {
  let module: TestingModule
  let repository: ReportRepository
  let prisma: PrismaService
  let userAId: string
  let userBId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: ReportRepository, useClass: PrismaReportRepository },
      ],
    }).compile()

    repository = module.get(ReportRepository)
    prisma = module.get(PrismaService)

    const ts = Date.now()
    const [userA, userB] = await Promise.all([
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Report User A',
          username: `report_a_${ts}`,
          email: `report_a_${ts}@example.com`,
          password: 'hashed',
        },
      }),
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Report User B',
          username: `report_b_${ts}`,
          email: `report_b_${ts}@example.com`,
          password: 'hashed',
        },
      }),
    ])
    userAId = userA.id
    userBId = userB.id
  })

  afterAll(async () => {
    await prisma.report.deleteMany({})
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } })
    await module.close()
  })

  beforeEach(async () => {
    await prisma.report.deleteMany({})
  })

  function makeReport(reporterId: string): Report {
    return Report.create({
      reporterId,
      type: ReportType.USER,
      category: ReportCategory.GENERAL,
      targetId: 'target-1',
      message: 'Test report message',
      attachments: null,
    })
  }

  it('saves and finds a report by id', async () => {
    const report = makeReport(userAId)
    await repository.save(report)

    const found = await repository.findById(report.id.toValue())
    expect(found).not.toBeNull()
    expect(found!.reporterId).toBe(userAId)
    expect(found!.status).toBe(ReportStatus.OPEN)
  })

  it('returns null when report does not exist', async () => {
    const found = await repository.findById('nonexistent-id')
    expect(found).toBeNull()
  })

  it('findByReporter returns only reports for that user', async () => {
    await repository.save(makeReport(userAId))
    await repository.save(makeReport(userAId))
    await repository.save(makeReport(userBId))

    const { items, total } = await repository.findByReporter(userAId, {
      page: 1,
      perPage: 10,
    })
    expect(total).toBe(2)
    expect(items).toHaveLength(2)
    items.forEach(r => expect(r.reporterId).toBe(userAId))
  })

  it('findByReporter supports pagination', async () => {
    await repository.save(makeReport(userAId))
    await repository.save(makeReport(userAId))
    await repository.save(makeReport(userAId))

    const page1 = await repository.findByReporter(userAId, {
      page: 1,
      perPage: 2,
    })
    expect(page1.items).toHaveLength(2)
    expect(page1.total).toBe(3)

    const page2 = await repository.findByReporter(userAId, {
      page: 2,
      perPage: 2,
    })
    expect(page2.items).toHaveLength(1)
  })

  it('findByReporter returns empty when user has no reports', async () => {
    const { items, total } = await repository.findByReporter(userAId, {
      page: 1,
      perPage: 10,
    })
    expect(items).toHaveLength(0)
    expect(total).toBe(0)
  })

  it('findAll returns all reports with pagination', async () => {
    await repository.save(makeReport(userAId))
    await repository.save(makeReport(userBId))

    const { items, total } = await repository.findAll({ page: 1, perPage: 10 })
    expect(total).toBe(2)
    expect(items).toHaveLength(2)
  })

  it('updates report status via save', async () => {
    const report = makeReport(userAId)
    await repository.save(report)

    report.updateStatus(ReportStatus.RESOLVED)
    await repository.save(report)

    const found = await repository.findById(report.id.toValue())
    expect(found!.status).toBe(ReportStatus.RESOLVED)
  })

  it('saves report with attachments', async () => {
    const report = Report.create({
      reporterId: userAId,
      type: ReportType.POST,
      category: ReportCategory.CSAE,
      targetId: 'post-1',
      message: 'CSAE content',
      attachments: ['https://example.com/evidence.jpg'],
    })
    await repository.save(report)

    const found = await repository.findById(report.id.toValue())
    expect(found!.attachments).toEqual(['https://example.com/evidence.jpg'])
  })
})
