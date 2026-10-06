import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface BlockProps {
  blockerId: string
  blockedId: string
  createdAt: Date
}

export class Block extends Entity<BlockProps> {
  get blockerId() {
    return this.props.blockerId
  }
  get blockedId() {
    return this.props.blockedId
  }
  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Omit<BlockProps, 'createdAt'>,
    id?: UniqueEntityID,
  ): Block {
    return new Block({ ...props, createdAt: new Date() }, id)
  }

  static reconstitute(props: BlockProps, id: UniqueEntityID): Block {
    return new Block(props, id)
  }
}
