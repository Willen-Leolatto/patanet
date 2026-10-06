import { AggregateRoot } from '@shared/domain/aggregate-root'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface UserDetail {
  id: string
  name: string
  displayName: string | null
  image: string | null
  username: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export interface MediaDetail {
  id: string
  path: string
  type: string
}

export interface LikeDetail {
  id: string
  userId: string
  user: UserDetail | null
  createdAt: Date
  updatedAt: Date
}

export interface CommentDetail {
  id: string
  message: string
  userId: string
  user: UserDetail | null
  parentId: string | null
  replies: CommentDetail[]
  createdAt: Date
  updatedAt: Date
}

export interface PetDetail {
  id: string
  name: string
  image: string | null
}

export interface EventDetail {
  id: string
  title: string
  description?: string | null
  date?: string | null
  time?: string | null
  locationText?: string | null
  latitude?: number | null
  longitude?: number | null
  imageUrl?: string | null
  postId?: string | null
  authorId: string
  createdAt: Date
  updatedAt: Date
}

export interface PostProps {
  subtitle: string
  authorId: string
  petIds: string[]
  createdAt: Date
  updatedAt: Date
  medias?: MediaDetail[]
  likes?: LikeDetail[]
  comments?: CommentDetail[]
  author?: UserDetail | null
  pets?: PetDetail[]
  eventId?: string | null
  event?: EventDetail | null
}

export class Post extends AggregateRoot<PostProps> {
  get subtitle() {
    return this.props.subtitle
  }
  get authorId() {
    return this.props.authorId
  }
  get petIds() {
    return this.props.petIds
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }
  get medias() {
    return this.props.medias
  }
  get likes() {
    return this.props.likes
  }
  get comments() {
    return this.props.comments
  }
  get author() {
    return this.props.author
  }
  get pets() {
    return this.props.pets
  }
  get eventId() {
    return this.props.eventId
  }
  get event() {
    return this.props.event
  }

  update(data: { subtitle?: string; petIds?: string[] }): void {
    if (data.subtitle !== undefined) this.props.subtitle = data.subtitle
    if (data.petIds !== undefined) this.props.petIds = data.petIds
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<PostProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Post {
    return new Post(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(props: PostProps, id: UniqueEntityID): Post {
    return new Post(props, id)
  }
}
