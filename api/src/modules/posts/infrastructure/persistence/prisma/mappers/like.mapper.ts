import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Like } from '@modules/posts/domain/entities/like'
import { Like as PrismaLike, User as PrismaUser } from '@prisma/client'

export class LikeMapper {
  static toDomain(row: PrismaLike & { user?: PrismaUser | null }): Like {
    return Like.reconstitute(
      {
        userId: row.userId,
        postId: row.postId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: row.user
          ? {
              id: row.user.id,
              name: row.user.name,
              displayName: row.user.displayName,
              image: row.user.image,
              username: row.user.username,
              email: row.user.email,
              createdAt: row.user.createdAt,
              updatedAt: row.user.updatedAt,
            }
          : undefined,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Like) {
    return {
      id: domain.id.toValue(),
      userId: domain.userId,
      postId: domain.postId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
