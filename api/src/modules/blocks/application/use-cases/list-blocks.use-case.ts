import { Injectable } from '@nestjs/common'
import { Block } from '../../domain/entities/block'
import { BlockRepository } from '../../domain/repositories/block.repository'

export interface ListBlocksInput {
  blockerId: string
  page: number
  perPage: number
}

export interface ListBlocksOutput {
  items: Block[]
  total: number
}

@Injectable()
export class ListBlocksUseCase {
  constructor(private readonly blockRepository: BlockRepository) {}

  async execute(input: ListBlocksInput): Promise<ListBlocksOutput> {
    return this.blockRepository.findByBlocker(input.blockerId, {
      page: input.page,
      perPage: input.perPage,
    })
  }
}
