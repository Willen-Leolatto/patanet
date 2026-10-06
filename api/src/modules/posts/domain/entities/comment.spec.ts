import { Comment } from './comment'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Comment entity', () => {
  it('exposes all props via getters', () => {
    const comment = Comment.reconstitute(
      {
        message: 'Great post!',
        userId: 'user-1',
        postId: 'post-1',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: null,
        replies: [],
      },
      new UniqueEntityID('comment-1'),
    )

    expect(comment.message).toBe('Great post!')
    expect(comment.userId).toBe('user-1')
    expect(comment.postId).toBe('post-1')
    expect(comment.parentId).toBeNull()
    expect(comment.createdAt).toBeInstanceOf(Date)
    expect(comment.updatedAt).toBeInstanceOf(Date)
    expect(comment.user).toBeNull()
    expect(comment.replies).toEqual([])
  })

  it('updates message with update()', () => {
    const comment = Comment.create({
      message: 'Hello',
      userId: 'user-1',
      postId: 'post-1',
      parentId: null,
    })

    comment.update('Updated message')

    expect(comment.message).toBe('Updated message')
  })

  it('creates with Comment.create()', () => {
    const comment = Comment.create({
      message: 'Hello',
      userId: 'user-1',
      postId: 'post-1',
      parentId: 'parent-1',
    })

    expect(comment.message).toBe('Hello')
    expect(comment.parentId).toBe('parent-1')
    expect(comment.createdAt).toBeInstanceOf(Date)
  })
})
