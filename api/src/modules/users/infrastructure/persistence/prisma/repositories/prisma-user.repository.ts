import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { User } from '../../../../domain/entities/user'
import { UserRepository } from '../../../../domain/repositories/user.repository'
import { UserMapper } from '../mappers/user.mapper'

const SENTINEL_EMAIL = 'deleted-user@patanet.internal'
const SENTINEL_USERNAME = 'deleted-user'

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } })
    return row ? UserMapper.toDomain(row) : null
  }

  async findByIdWithAnimalsCount(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { animals: true } } },
    })
    return row ? UserMapper.toDomain(row, row._count.animals) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } })
    return row ? UserMapper.toDomain(row) : null
  }

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { username } })
    return row ? UserMapper.toDomain(row) : null
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { googleId } })
    return row ? UserMapper.toDomain(row) : null
  }

  async findMany(params: {
    query?: string
    page: number
    perPage: number
  }): Promise<{ items: User[]; total: number }> {
    const { query, page, perPage } = params

    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { username: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : undefined

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: perPage,
        skip: (page - 1) * perPage,
        include: { _count: { select: { animals: true } } },
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      items: rows.map(row => UserMapper.toDomain(row, row._count.animals)),
      total,
    }
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user)
    const exists = await this.prisma.user.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.user.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.user.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.deleteMany({ where: { id } })
  }

  async purge(id: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      let sentinel = await tx.user.findUnique({
        where: { email: SENTINEL_EMAIL },
      })
      if (!sentinel) {
        sentinel = await tx.user.create({
          data: {
            id: randomUUID(),
            name: 'Conta Excluída',
            username: SENTINEL_USERNAME,
            email: SENTINEL_EMAIL,
            password: null,
            isActive: false,
          },
        })
      }

      // Conteudo preservado (threads de terceiros nao podem quebrar) --
      // reatribuido a conta sentinela em vez de apagado.
      await tx.post.updateMany({
        where: { authorId: id },
        data: { authorId: sentinel.id },
      })
      await tx.comment.updateMany({
        where: { userId: id },
        data: { userId: sentinel.id },
      })
      await tx.event.updateMany({
        where: { authorId: id },
        data: { authorId: sentinel.id },
      })

      // Dado exclusivamente pessoal -- removido de fato.
      await tx.like.deleteMany({ where: { userId: id } })
      await tx.connection.deleteMany({
        where: { OR: [{ followerId: id }, { followingId: id }] },
      })
      await tx.eventAttendance.deleteMany({ where: { userId: id } })
      await tx.animalUserVisibility.deleteMany({ where: { userId: id } })
      await tx.veterinarianProfile.deleteMany({ where: { userId: id } })
      await tx.petshop.deleteMany({ where: { ownerUserId: id } })

      // Block (onDelete: Cascade), SupportTicket+messages (Cascade/SetNull)
      // e Report do reporter (Cascade) sao removidos automaticamente pelo
      // delete do User abaixo -- ver constraints em prisma/schema.prisma.
      await tx.user.delete({ where: { id } })
    })
  }
}
