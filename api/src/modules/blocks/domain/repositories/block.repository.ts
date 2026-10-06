import { Block } from '../entities/block'

export abstract class BlockRepository {
  abstract findByBlockerAndBlocked(
    blockerId: string,
    blockedId: string,
  ): Promise<Block | null>
  abstract findByBlocker(
    blockerId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: Block[]; total: number }>
  abstract save(block: Block): Promise<void>
  abstract delete(id: string): Promise<void>
}
