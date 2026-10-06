import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface ConnectionProps {
  followerId: string
  followingId: string
  createdAt: Date
}

export class Connection extends Entity<ConnectionProps> {
  get followerId() {
    return this.props.followerId
  }
  get followingId() {
    return this.props.followingId
  }
  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Omit<ConnectionProps, 'createdAt'>,
    id?: UniqueEntityID,
  ): Connection {
    return new Connection({ ...props, createdAt: new Date() }, id)
  }

  static reconstitute(props: ConnectionProps, id: UniqueEntityID): Connection {
    return new Connection(props, id)
  }
}
