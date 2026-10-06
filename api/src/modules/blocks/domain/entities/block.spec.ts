import { Block } from './block'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Block entity', () => {
  it('exposes all props via getters', () => {
    const block = Block.reconstitute(
      {
        blockerId: 'user-1',
        blockedId: 'user-2',
        createdAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('block-1'),
    )

    expect(block.blockerId).toBe('user-1')
    expect(block.blockedId).toBe('user-2')
    expect(block.createdAt).toBeInstanceOf(Date)
  })

  it('creates with Block.create()', () => {
    const block = Block.create({ blockerId: 'user-1', blockedId: 'user-2' })

    expect(block.blockerId).toBe('user-1')
    expect(block.blockedId).toBe('user-2')
    expect(block.createdAt).toBeInstanceOf(Date)
  })
})
