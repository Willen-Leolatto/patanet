import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { ConnectionRepository } from '@modules/posts/domain/repositories/connection.repository'

@Injectable()
export class PrismaConnectionRepository implements ConnectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFollowedIdsByUserId(userId: string): Promise<string[]> {
    const connections = await this.prisma.connection.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    return connections.map(c => c.followingId)
  }
}
