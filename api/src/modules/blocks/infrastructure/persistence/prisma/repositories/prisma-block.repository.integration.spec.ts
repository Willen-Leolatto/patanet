import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { BlockRepository } from '@modules/blocks/domain/repositories/block.repository'
import { Block } from '@modules/blocks/domain/entities/block'
import { PrismaBlockRepository } from './prisma-block.repository'

describe('PrismaBlockRepository (integration)', () => {
  let module: TestingModule
  let repository: BlockRepository
  let prisma: PrismaService
  let userAId: string
  let userBId: string
  let userCId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: BlockRepository, useClass: PrismaBlockRepository },
      ],
    }).compile()

    repository = module.get(BlockRepository)
    prisma = module.get(PrismaService)

    const ts = Date.now()
    const [userA, userB, userC] = await Promise.all([
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Block User A',
          username: `block_a_${ts}`,
          email: `block_a_${ts}@example.com`,
          password: 'hashed',
        },
      }),
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Block User B',
          username: `block_b_${ts}`,
          email: `block_b_${ts}@example.com`,
          password: 'hashed',
        },
      }),
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Block User C',
          username: `block_c_${ts}`,
          email: `block_c_${ts}@example.com`,
          password: 'hashed',
        },
      }),
    ])
    userAId = userA.id
    userBId = userB.id
    userCId = userC.id
  })

  afterAll(async () => {
    await prisma.block.deleteMany({})
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId, userCId] } },
    })
    await module.close()
  })

  beforeEach(async () => {
    await prisma.block.deleteMany({})
  })

  function makeBlock(blockerId: string, blockedId: string): Block {
    return Block.create({ blockerId, blockedId })
  }

  it('saves and finds a block by blocker and blocked', async () => {
    await repository.save(makeBlock(userAId, userBId))

    const found = await repository.findByBlockerAndBlocked(userAId, userBId)
    expect(found).not.toBeNull()
    expect(found!.blockerId).toBe(userAId)
    expect(found!.blockedId).toBe(userBId)
  })

  it('returns null when block does not exist', async () => {
    const found = await repository.findByBlockerAndBlocked(userAId, userBId)
    expect(found).toBeNull()
  })

  it('findByBlocker returns paginated blocks made by a user', async () => {
    await repository.save(makeBlock(userAId, userBId))
    await repository.save(makeBlock(userAId, userCId))

    const { items, total } = await repository.findByBlocker(userAId, {
      page: 1,
      perPage: 10,
    })
    expect(total).toBe(2)
    expect(items).toHaveLength(2)
  })

  it('deletes a block', async () => {
    const block = makeBlock(userAId, userBId)
    await repository.save(block)

    await repository.delete(block.id.toValue())

    const found = await repository.findByBlockerAndBlocked(userAId, userBId)
    expect(found).toBeNull()
  })
})
