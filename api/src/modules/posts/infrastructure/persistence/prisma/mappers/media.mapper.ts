import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Media, MediaType } from '@modules/posts/domain/entities/media'
import { Media as PrismaMedia } from '@prisma/client'

export class MediaMapper {
  static toDomain(row: PrismaMedia): Media {
    return Media.reconstitute(
      {
        path: row.path,
        type: row.type as unknown as MediaType,
        postId: row.postId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Media) {
    return {
      id: domain.id.toValue(),
      path: domain.path,
      type: domain.type as unknown as PrismaMedia['type'],
      postId: domain.postId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
