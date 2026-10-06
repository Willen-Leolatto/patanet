import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Like } from '@modules/posts/domain/entities/like'
import { LikeRepository } from '@modules/posts/domain/repositories/like.repository'
import { LikeMapper } from '../mappers/like.mapper'

@Injectable()
export class PrismaLikeRepository implements LikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndPost(
    userId: string,
    postId: string,
  ): Promise<Like | null> {
    const row = await this.prisma.like.findFirst({ where: { userId, postId } })
    return row ? LikeMapper.toDomain(row) : null
  }

  async save(like: Like): Promise<void> {
    const data = LikeMapper.toPersistence(like)
    const exists = await this.prisma.like.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.like.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.like.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.like.deleteMany({ where: { id } })
  }

  async deleteByPostId(postId: string): Promise<void> {
    await this.prisma.like.deleteMany({ where: { postId } })
  }
}
