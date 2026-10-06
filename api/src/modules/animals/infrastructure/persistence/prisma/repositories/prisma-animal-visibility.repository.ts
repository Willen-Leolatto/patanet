import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { AnimalVisibilityRepository } from '@modules/animals/domain/repositories/animal-visibility.repository'

@Injectable()
export class PrismaAnimalVisibilityRepository
  implements AnimalVisibilityRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findHiddenIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.animalUserVisibility.findMany({
      where: { userId, hidden: true },
      select: { animalId: true },
    })
    return rows.map(r => r.animalId)
  }

  async upsert(
    animalId: string,
    userId: string,
    hidden: boolean,
  ): Promise<void> {
    await this.prisma.animalUserVisibility.upsert({
      where: { animalId_userId: { animalId, userId } },
      create: { id: randomUUID(), animalId, userId, hidden },
      update: { hidden },
    })
  }

  async deleteByUser(userId: string): Promise<void> {
    await this.prisma.animalUserVisibility.deleteMany({ where: { userId } })
  }
}
