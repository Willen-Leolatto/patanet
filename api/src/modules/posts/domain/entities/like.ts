import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { UserDetail } from './post'

export interface LikeProps {
  userId: string
  postId: string
  createdAt: Date
  updatedAt: Date
  user?: UserDetail | null
}

export class Like extends Entity<LikeProps> {
  get userId() {
    return this.props.userId
  }
  get postId() {
    return this.props.postId
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

  static create(
    props: Omit<LikeProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Like {
    return new Like(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(props: LikeProps, id: UniqueEntityID): Like {
    return new Like(props, id)
  }
}
