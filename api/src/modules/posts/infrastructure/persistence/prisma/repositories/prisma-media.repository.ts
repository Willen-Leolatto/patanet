import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Media } from '@modules/posts/domain/entities/media'
import { MediaRepository } from '@modules/posts/domain/repositories/media.repository'
import { MediaMapper } from '../mappers/media.mapper'

@Injectable()
export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPostId(postId: string): Promise<Media[]> {
    const rows = await this.prisma.media.findMany({ where: { postId } })
    return rows.map(row => MediaMapper.toDomain(row))
  }

  async save(media: Media): Promise<void> {
    const data = MediaMapper.toPersistence(media)
    const exists = await this.prisma.media.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.media.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.media.create({ data })
    }
  }

  async deleteByPostId(postId: string): Promise<void> {
    await this.prisma.media.deleteMany({ where: { postId } })
  }
}
