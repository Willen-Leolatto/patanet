import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Connection } from '@modules/connections/domain/entities/connection'
import { ConnectionRepository } from '@modules/connections/domain/repositories/connection.repository'
import { User } from '@modules/users/domain/entities/user'
import { UserMapper } from '@modules/users/infrastructure/persistence/prisma/mappers/user.mapper'
import { ConnectionMapper } from '../mappers/connection.mapper'

@Injectable()
export class PrismaConnectionRepository implements ConnectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<Connection | null> {
    const row = await this.prisma.connection.findFirst({
      where: { followerId, followingId },
    })
    return row ? ConnectionMapper.toDomain(row) : null
  }

  async findFollowers(
    userId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: User[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.connection.findMany({
        where: { followingId: userId },
        include: { follower: true },
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.connection.count({ where: { followingId: userId } }),
    ])
    return { items: rows.map(c => UserMapper.toDomain(c.follower)), total }
  }

  async findFollowing(
    userId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: User[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.connection.findMany({
        where: { followerId: userId },
        include: { following: true },
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
      }),
      this.prisma.connection.count({ where: { followerId: userId } }),
    ])
    return { items: rows.map(c => UserMapper.toDomain(c.following)), total }
  }

  async countFollowers(userId: string): Promise<number> {
    return this.prisma.connection.count({ where: { followingId: userId } })
  }

  async countFollowing(userId: string): Promise<number> {
    return this.prisma.connection.count({ where: { followerId: userId } })
  }

  async save(connection: Connection): Promise<void> {
    const data = ConnectionMapper.toPersistence(connection)
    const exists = await this.prisma.connection.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.connection.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.connection.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.connection.deleteMany({ where: { id } })
  }
}
