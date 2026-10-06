import { Like } from './like'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Like entity', () => {
  it('exposes all props via getters', () => {
    const like = Like.reconstitute(
      {
        userId: 'user-1',
        postId: 'post-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: null,
      },
      new UniqueEntityID('like-1'),
    )

    expect(like.userId).toBe('user-1')
    expect(like.postId).toBe('post-1')
    expect(like.createdAt).toBeInstanceOf(Date)
    expect(like.updatedAt).toBeInstanceOf(Date)
    expect(like.user).toBeNull()
  })

  it('creates with Like.create()', () => {
    const like = Like.create({ userId: 'user-1', postId: 'post-1' })

    expect(like.userId).toBe('user-1')
    expect(like.postId).toBe('post-1')
    expect(like.createdAt).toBeInstanceOf(Date)
  })
})
