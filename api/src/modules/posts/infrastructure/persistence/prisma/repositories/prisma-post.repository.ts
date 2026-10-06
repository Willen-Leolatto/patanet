import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Post } from '@modules/posts/domain/entities/post'
import { PostRepository } from '@modules/posts/domain/repositories/post.repository'
import { PostMapper } from '../mappers/post.mapper'
import { Event as PrismaEvent } from '@prisma/client'

@Injectable()
export class PrismaPostRepository implements PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async attachEvents(
    postIds: string[],
  ): Promise<Map<string, PrismaEvent>> {
    if (postIds.length === 0) return new Map()
    const events = await this.prisma.event.findMany({
      where: { postId: { in: postIds } },
    })
    return new Map(events.map(e => [e.postId!, e]))
  }

  // Filtro de bloqueios mutuos (ver GetPostByIdUseCase/GetFeedUseCase/
  // GetPostsByUserUseCase): posts e comentarios de usuarios bloqueados nao
  // aparecem, via NOT IN gerado pelo Prisma.
  private getInclude(excludeUserIds: string[] = []) {
    const commentWhere =
      excludeUserIds.length > 0 ? { userId: { notIn: excludeUserIds } } : {}
    return {
      author: true,
      pets: true,
      medias: true,
      likes: { include: { user: true } },
      comments: {
        where: { parentId: null, ...commentWhere },
        include: {
          user: true,
          replies: { where: commentWhere, include: { user: true } },
        },
      },
    }
  }

  async findById(id: string, excludeUserIds: string[] = []): Promise<Post | null> {
    const row = await this.prisma.post.findUnique({
      where: {
        id,
        ...(excludeUserIds.length > 0
          ? { authorId: { notIn: excludeUserIds } }
          : {}),
      },
      include: this.getInclude(excludeUserIds),
    })
    if (!row) return null
    const eventsMap = await this.attachEvents([row.id])
    return PostMapper.toDomain(row, eventsMap.get(row.id) ?? null)
  }

  async findFeed(
    userId: string,
    followedIds: string[],
    params: { page: number; perPage: number },
    excludeUserIds: string[] = [],
  ): Promise<{ items: Post[]; total: number }> {
    const allIds = [...new Set([userId, ...followedIds])]
    const where = {
      authorId: {
        in: allIds,
        ...(excludeUserIds.length > 0 ? { notIn: excludeUserIds } : {}),
      },
    }

    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
        include: this.getInclude(excludeUserIds),
      }),
      this.prisma.post.count({ where }),
    ])
    const eventsMap = await this.attachEvents(rows.map(r => r.id))
    return {
      items: rows.map(row => PostMapper.toDomain(row, eventsMap.get(row.id) ?? null)),
      total,
    }
  }

  async findByUserId(
    userId: string,
    params: { page: number; perPage: number },
    excludeUserIds: string[] = [],
  ): Promise<{ items: Post[]; total: number }> {
    const where = {
      authorId: userId,
      ...(excludeUserIds.length > 0
        ? { NOT: { authorId: { in: excludeUserIds } } }
        : {}),
    }
    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.perPage,
        skip: (params.page - 1) * params.perPage,
        include: this.getInclude(excludeUserIds),
      }),
      this.prisma.post.count({ where }),
    ])
    const eventsMap = await this.attachEvents(rows.map(r => r.id))
    return {
      items: rows.map(row => PostMapper.toDomain(row, eventsMap.get(row.id) ?? null)),
      total,
    }
  }

  async save(post: Post): Promise<void> {
    const data = PostMapper.toPersistence(post)
    const petIds = post.petIds.map(id => ({ id }))
    const exists = await this.prisma.post.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.post.update({
        where: { id: data.id },
        data: { ...data, pets: { set: petIds } },
      })
    } else {
      await this.prisma.post.create({
        data: { ...data, pets: { connect: petIds } },
      })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.deleteMany({ where: { id } })
  }
}
