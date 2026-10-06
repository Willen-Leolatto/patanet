import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Connection } from '@modules/connections/domain/entities/connection'
import { Connection as PrismaConnection } from '@prisma/client'

export class ConnectionMapper {
  static toDomain(row: PrismaConnection): Connection {
    return Connection.reconstitute(
      {
        followerId: row.followerId,
        followingId: row.followingId,
        createdAt: row.createdAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Connection) {
    return {
      id: domain.id.toValue(),
      followerId: domain.followerId,
      followingId: domain.followingId,
      createdAt: domain.createdAt,
    }
  }
}
