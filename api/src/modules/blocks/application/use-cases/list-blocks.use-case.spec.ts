import { Block } from '../../domain/entities/block'
import { BlockRepository } from '../../domain/repositories/block.repository'
import { ListBlocksUseCase } from './list-blocks.use-case'

const mockBlockRepo = (): jest.Mocked<BlockRepository> => ({
  findByBlockerAndBlocked: jest.fn(),
  findByBlocker: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('ListBlocksUseCase', () => {
  let useCase: ListBlocksUseCase
  let blockRepo: jest.Mocked<BlockRepository>

  beforeEach(() => {
    blockRepo = mockBlockRepo()
    useCase = new ListBlocksUseCase(blockRepo)
  })

  it('returns paginated list of blocks', async () => {
    const block1 = Block.create({ blockerId: 'user-1', blockedId: 'user-2' })
    const block2 = Block.create({ blockerId: 'user-1', blockedId: 'user-3' })
    blockRepo.findByBlocker.mockResolvedValue({
      items: [block1, block2],
      total: 2,
    })

    const result = await useCase.execute({
      blockerId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(blockRepo.findByBlocker).toHaveBeenCalledWith('user-1', {
      page: 1,
      perPage: 10,
    })
  })

  it('returns empty list when user has no blocks', async () => {
    blockRepo.findByBlocker.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({
      blockerId: 'user-1',
      page: 1,
      perPage: 10,
    })

    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('passes pagination params to repository', async () => {
    blockRepo.findByBlocker.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ blockerId: 'user-1', page: 2, perPage: 5 })

    expect(blockRepo.findByBlocker).toHaveBeenCalledWith('user-1', {
      page: 2,
      perPage: 5,
    })
  })
})
