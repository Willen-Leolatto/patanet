import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Comment, CommentProps } from '@modules/posts/domain/entities/comment'
import {
  Comment as PrismaComment,
  User as PrismaUser,
} from '@prisma/client'

type CommentRow = PrismaComment & {
  user?: PrismaUser | null
  replies?: (PrismaComment & { user?: PrismaUser | null })[]
}

function mapUser(user: PrismaUser | null | undefined) {
  if (!user) return undefined
  return {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    image: user.image,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function ormToProps(row: CommentRow): CommentProps {
  return {
    message: row.message,
    userId: row.userId,
    postId: row.postId,
    parentId: row.parentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: mapUser(row.user),
    replies: row.replies ? row.replies.map(ormToProps) : [],
  }
}

export class CommentMapper {
  static toDomain(row: CommentRow): Comment {
    return Comment.reconstitute(ormToProps(row), new UniqueEntityID(row.id))
  }

  static toPersistence(domain: Comment) {
    return {
      id: domain.id.toValue(),
      message: domain.message,
      userId: domain.userId,
      postId: domain.postId,
      parentId: domain.parentId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
