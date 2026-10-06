import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import {
  Post,
  PostProps,
  CommentDetail,
} from '@modules/posts/domain/entities/post'
import {
  Post as PrismaPost,
  Comment as PrismaComment,
  Like as PrismaLike,
  Media as PrismaMedia,
  User as PrismaUser,
  Animal as PrismaAnimal,
  Event as PrismaEvent,
} from '@prisma/client'

type CommentRow = PrismaComment & {
  user?: PrismaUser | null
  replies?: (PrismaComment & { user?: PrismaUser | null })[]
}

type PostRow = PrismaPost & {
  author?: PrismaUser | null
  pets?: PrismaAnimal[]
  medias?: PrismaMedia[]
  likes?: (PrismaLike & { user?: PrismaUser | null })[]
  comments?: CommentRow[]
}

function mapUser(user: PrismaUser | undefined | null) {
  if (!user) return null
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

function mapMedia(m: PrismaMedia) {
  return { id: m.id, path: m.path, type: m.type }
}

function mapLike(l: PrismaLike & { user?: PrismaUser | null }) {
  return {
    id: l.id,
    userId: l.userId,
    user: mapUser(l.user),
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }
}

function mapComment(c: CommentRow): CommentDetail {
  return {
    id: c.id,
    message: c.message,
    userId: c.userId,
    user: mapUser(c.user),
    parentId: c.parentId,
    replies: c.replies ? c.replies.map(mapComment) : [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

function mapPet(a: PrismaAnimal) {
  return { id: a.id, name: a.name, image: a.image }
}

export class PostMapper {
  static toDomain(row: PostRow, event?: PrismaEvent | null): Post {
    const eventDetail = event
      ? {
          id: event.id,
          title: event.title,
          description: event.description ?? null,
          date: event.date ?? null,
          time: event.time ?? null,
          locationText: event.locationText ?? null,
          latitude: event.latitude != null ? Number(event.latitude) : null,
          longitude: event.longitude != null ? Number(event.longitude) : null,
          imageUrl: event.imageUrl ?? null,
          postId: event.postId ?? null,
          authorId: event.authorId,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }
      : null

    const props: PostProps = {
      subtitle: row.subtitle,
      authorId: row.authorId,
      petIds: row.pets ? row.pets.map(p => p.id) : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author ? mapUser(row.author) : undefined,
      pets: row.pets ? row.pets.map(mapPet) : undefined,
      medias: row.medias ? row.medias.map(mapMedia) : undefined,
      likes: row.likes ? row.likes.map(mapLike) : undefined,
      comments: row.comments ? row.comments.map(mapComment) : undefined,
      eventId: eventDetail?.id ?? null,
      event: eventDetail,
    }
    return Post.reconstitute(props, new UniqueEntityID(row.id))
  }

  static toPersistence(domain: Post) {
    return {
      id: domain.id.toValue(),
      subtitle: domain.subtitle,
      authorId: domain.authorId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
