import { Block } from '../../domain/entities/block'

export class ResponseBlockDto {
  readonly id: string
  readonly blockerId: string
  readonly blockedId: string
  readonly createdAt: Date

  constructor(block: Block) {
    this.id = block.id.toValue()
    this.blockerId = block.blockerId
    this.blockedId = block.blockedId
    this.createdAt = block.createdAt
  }
}
