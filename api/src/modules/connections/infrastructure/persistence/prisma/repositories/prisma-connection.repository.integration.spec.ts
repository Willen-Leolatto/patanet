import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { ConnectionRepository } from '@modules/connections/domain/repositories/connection.repository'
import { Connection } from '@modules/connections/domain/entities/connection'
import { PrismaConnectionRepository } from './prisma-connection.repository'

describe('PrismaConnectionRepository (integration)', () => {
  let module: TestingModule
  let repository: ConnectionRepository
  let prisma: PrismaService
  let userAId: string
  let userBId: string

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: ConnectionRepository, useClass: PrismaConnectionRepository },
      ],
    }).compile()

    repository = module.get(ConnectionRepository)
    prisma = module.get(PrismaService)

    const ts = Date.now()
    const [userA, userB] = await Promise.all([
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Conn User A',
          username: `conn_a_${ts}`,
          email: `conn_a_${ts}@example.com`,
          password: 'hashed',
        },
      }),
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: 'Conn User B',
          username: `conn_b_${ts}`,
          email: `conn_b_${ts}@example.com`,
          password: 'hashed',
        },
      }),
    ])
    userAId = userA.id
    userBId = userB.id
  })

  afterAll(async () => {
    await prisma.connection.deleteMany({})
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } })
    await module.close()
  })

  beforeEach(async () => {
    await prisma.connection.deleteMany({})
  })

  function makeConnection(followerId: string, followingId: string): Connection {
    return Connection.create({ followerId, followingId })
  }

  it('saves and finds a connection by follower and following', async () => {
    const conn = makeConnection(userAId, userBId)
    await repository.save(conn)

    const found = await repository.findByFollowerAndFollowing(userAId, userBId)
    expect(found).not.toBeNull()
    expect(found!.followerId).toBe(userAId)
    expect(found!.followingId).toBe(userBId)
  })

  it('returns null when connection does not exist', async () => {
    const found = await repository.findByFollowerAndFollowing(userAId, userBId)
    expect(found).toBeNull()
  })

  it('findFollowers returns users who follow the given user', async () => {
    await repository.save(makeConnection(userAId, userBId))

    const { items, total } = await repository.findFollowers(userBId, {
      page: 1,
      perPage: 10,
    })
    expect(total).toBe(1)
    expect(items[0].id.toValue()).toBe(userAId)
  })

  it('findFollowing returns users that the given user follows', async () => {
    await repository.save(makeConnection(userAId, userBId))

    const { items, total } = await repository.findFollowing(userAId, {
      page: 1,
      perPage: 10,
    })
    expect(total).toBe(1)
    expect(items[0].id.toValue()).toBe(userBId)
  })

  it('deletes a connection', async () => {
    const conn = makeConnection(userAId, userBId)
    await repository.save(conn)

    await repository.delete(conn.id.toValue())

    const found = await repository.findByFollowerAndFollowing(userAId, userBId)
    expect(found).toBeNull()
  })
})
