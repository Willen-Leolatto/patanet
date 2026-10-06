import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Comment } from '@modules/posts/domain/entities/comment'
import { CommentRepository } from '@modules/posts/domain/repositories/comment.repository'
import { CommentMapper } from '../mappers/comment.mapper'

@Injectable()
export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Comment | null> {
    const row = await this.prisma.comment.findUnique({
      where: { id },
      include: { user: true, replies: { include: { user: true } } },
    })
    return row ? CommentMapper.toDomain(row) : null
  }

  async save(comment: Comment): Promise<void> {
    const data = CommentMapper.toPersistence(comment)
    const exists = await this.prisma.comment.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.comment.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.comment.create({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.deleteMany({ where: { parentId: id } })
    await this.prisma.comment.deleteMany({ where: { id } })
  }

  async deleteByPostId(postId: string): Promise<void> {
    await this.prisma.comment.deleteMany({
      where: { postId, parentId: { not: null } },
    })
    await this.prisma.comment.deleteMany({ where: { postId } })
  }
}
