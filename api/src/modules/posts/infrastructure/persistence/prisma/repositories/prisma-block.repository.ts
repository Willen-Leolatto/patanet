import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { BlockRepository } from '@modules/posts/domain/repositories/block.repository'

@Injectable()
export class PrismaBlockRepository implements BlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    })
    return blocks.map(b => (b.blockerId === userId ? b.blockedId : b.blockerId))
  }
}
