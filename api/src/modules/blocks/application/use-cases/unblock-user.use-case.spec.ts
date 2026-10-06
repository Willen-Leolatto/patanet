import { Block } from '../../domain/entities/block'
import { BlockRepository } from '../../domain/repositories/block.repository'
import { UnblockUserUseCase } from './unblock-user.use-case'

const mockBlockRepo = (): jest.Mocked<BlockRepository> => ({
  findByBlockerAndBlocked: jest.fn(),
  findByBlocker: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('UnblockUserUseCase', () => {
  let useCase: UnblockUserUseCase
  let blockRepo: jest.Mocked<BlockRepository>

  beforeEach(() => {
    blockRepo = mockBlockRepo()
    useCase = new UnblockUserUseCase(blockRepo)
  })

  it('deletes the block on happy path', async () => {
    const existing = Block.create({ blockerId: 'user-1', blockedId: 'user-2' })
    blockRepo.findByBlockerAndBlocked.mockResolvedValue(existing)
    blockRepo.delete.mockResolvedValue()

    await useCase.execute({ blockerId: 'user-1', blockedId: 'user-2' })

    expect(blockRepo.delete).toHaveBeenCalledWith(existing.id.toValue())
  })

  it('is a no-op when user was not blocked', async () => {
    blockRepo.findByBlockerAndBlocked.mockResolvedValue(null)

    await useCase.execute({ blockerId: 'user-1', blockedId: 'user-2' })

    expect(blockRepo.delete).not.toHaveBeenCalled()
  })
})
