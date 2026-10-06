import {
  Post,
  UserDetail,
  MediaDetail,
  LikeDetail,
  CommentDetail,
  PetDetail,
  EventDetail,
} from '../../domain/entities/post'

export class ResponsePostDto {
  readonly id: string
  readonly subtitle: string
  readonly medias: MediaDetail[]
  readonly pets: PetDetail[]
  readonly likes: LikeDetail[]
  readonly comments: CommentDetail[]
  readonly author: UserDetail | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly eventId: string | null
  readonly event: EventDetail | null

  constructor(post: Post) {
    this.id = post.id.toValue()
    this.subtitle = post.subtitle
    this.medias = post.medias ?? []
    this.pets = post.pets ?? []
    this.likes = post.likes ?? []
    this.comments = post.comments ?? []
    this.author = post.author ?? null
    this.createdAt = post.createdAt
    this.updatedAt = post.updatedAt
    this.eventId = post.eventId ?? null
    this.event = post.event ?? null
  }
}
