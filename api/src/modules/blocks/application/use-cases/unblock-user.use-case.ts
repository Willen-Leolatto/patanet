import { Injectable } from '@nestjs/common'
import { BlockRepository } from '../../domain/repositories/block.repository'

export interface UnblockUserInput {
  blockerId: string
  blockedId: string
}

@Injectable()
export class UnblockUserUseCase {
  constructor(private readonly blockRepository: BlockRepository) {}

  async execute(input: UnblockUserInput): Promise<void> {
    const existing = await this.blockRepository.findByBlockerAndBlocked(
      input.blockerId,
      input.blockedId,
    )
    if (!existing) return

    await this.blockRepository.delete(existing.id.toValue())
  }
}
