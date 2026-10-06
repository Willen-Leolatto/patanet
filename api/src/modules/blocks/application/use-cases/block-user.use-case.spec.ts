import { BadRequestException } from '@nestjs/common'
import { Block } from '../../domain/entities/block'
import { BlockRepository } from '../../domain/repositories/block.repository'
import { BlockUserUseCase } from './block-user.use-case'

const mockBlockRepo = (): jest.Mocked<BlockRepository> => ({
  findByBlockerAndBlocked: jest.fn(),
  findByBlocker: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('BlockUserUseCase', () => {
  let useCase: BlockUserUseCase
  let blockRepo: jest.Mocked<BlockRepository>

  beforeEach(() => {
    blockRepo = mockBlockRepo()
    useCase = new BlockUserUseCase(blockRepo)
  })

  it('saves a block on happy path', async () => {
    blockRepo.findByBlockerAndBlocked.mockResolvedValue(null)
    blockRepo.save.mockResolvedValue()

    await useCase.execute({ blockerId: 'user-1', blockedId: 'user-2' })

    expect(blockRepo.save).toHaveBeenCalledTimes(1)
    const saved = blockRepo.save.mock.calls[0][0]
    expect(saved.blockerId).toBe('user-1')
    expect(saved.blockedId).toBe('user-2')
  })

  it('throws BadRequestException when blocking yourself', async () => {
    await expect(
      useCase.execute({ blockerId: 'user-1', blockedId: 'user-1' }),
    ).rejects.toThrow(BadRequestException)

    expect(blockRepo.findByBlockerAndBlocked).not.toHaveBeenCalled()
    expect(blockRepo.save).not.toHaveBeenCalled()
  })

  it('is idempotent when user is already blocked', async () => {
    const existing = Block.create({ blockerId: 'user-1', blockedId: 'user-2' })
    blockRepo.findByBlockerAndBlocked.mockResolvedValue(existing)

    await useCase.execute({ blockerId: 'user-1', blockedId: 'user-2' })

    expect(blockRepo.save).not.toHaveBeenCalled()
  })
})
