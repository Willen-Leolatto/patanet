import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Block } from '@modules/blocks/domain/entities/block'
import { Block as PrismaBlock } from '@prisma/client'

export class BlockMapper {
  static toDomain(row: PrismaBlock): Block {
    return Block.reconstitute(
      {
        blockerId: row.blockerId,
        blockedId: row.blockedId,
        createdAt: row.createdAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Block) {
    return {
      id: domain.id.toValue(),
      blockerId: domain.blockerId,
      blockedId: domain.blockedId,
      createdAt: domain.createdAt,
    }
  }
}
