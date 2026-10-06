import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { UserDetail } from './post'

export interface CommentProps {
  message: string
  userId: string
  postId: string
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  user?: UserDetail | null
  replies?: CommentProps[]
}

export class Comment extends Entity<CommentProps> {
  get message() {
    return this.props.message
  }
  get userId() {
    return this.props.userId
  }
  get postId() {
    return this.props.postId
  }
  get parentId() {
    return this.props.parentId
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }
  get user() {
    return this.props.user
  }
  get replies() {
    return this.props.replies
  }

  update(message: string): void {
    this.props.message = message
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<CommentProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Comment {
    return new Comment(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(props: CommentProps, id: UniqueEntityID): Comment {
    return new Comment(props, id)
  }
}
