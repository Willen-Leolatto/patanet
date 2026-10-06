import { BadRequestException, Injectable } from '@nestjs/common'
import { Block } from '../../domain/entities/block'
import { BlockRepository } from '../../domain/repositories/block.repository'

export interface BlockUserInput {
  blockerId: string
  blockedId: string
}

@Injectable()
export class BlockUserUseCase {
  constructor(private readonly blockRepository: BlockRepository) {}

  async execute(input: BlockUserInput): Promise<void> {
    if (input.blockerId === input.blockedId) {
      throw new BadRequestException('You cannot block yourself')
    }

    const existing = await this.blockRepository.findByBlockerAndBlocked(
      input.blockerId,
      input.blockedId,
    )
    if (existing) return

    const block = Block.create({
      blockerId: input.blockerId,
      blockedId: input.blockedId,
    })
    await this.blockRepository.save(block)
  }
}
