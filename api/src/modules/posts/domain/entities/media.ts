import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export type MediaType = 'IMAGE' | 'VIDEO'

export interface MediaProps {
  path: string
  type: MediaType
  postId: string
  createdAt: Date
  updatedAt: Date
}

export class Media extends Entity<MediaProps> {
  get path() {
    return this.props.path
  }
  get type() {
    return this.props.type
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

  static create(
    props: Omit<MediaProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Media {
    return new Media(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(props: MediaProps, id: UniqueEntityID): Media {
    return new Media(props, id)
  }
}
