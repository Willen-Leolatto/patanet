import { Post } from './post'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

function makePost(): Post {
  return Post.reconstitute(
    {
      subtitle: 'Hello world',
      authorId: 'user-1',
      petIds: ['pet-1'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      medias: [{ id: 'media-1', path: 'https://cdn/img.jpg', type: 'IMAGE' }],
      likes: [],
      comments: [],
      author: {
        id: 'user-1',
        name: 'John',
        displayName: null,
        image: null,
        username: 'john',
        email: 'john@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      pets: [{ id: 'pet-1', name: 'Rex', image: null }],
      eventId: 'event-1',
      event: null,
    },
    new UniqueEntityID('post-1'),
  )
}

describe('Post entity', () => {
  it('exposes all props via getters', () => {
    const post = makePost()

    expect(post.subtitle).toBe('Hello world')
    expect(post.authorId).toBe('user-1')
    expect(post.petIds).toEqual(['pet-1'])
    expect(post.createdAt).toBeInstanceOf(Date)
    expect(post.updatedAt).toBeInstanceOf(Date)
    expect(post.medias).toHaveLength(1)
    expect(post.likes).toEqual([])
    expect(post.comments).toEqual([])
    expect(post.author?.name).toBe('John')
    expect(post.pets).toHaveLength(1)
    expect(post.eventId).toBe('event-1')
    expect(post.event).toBeNull()
  })

  it('updates subtitle and petIds with update()', () => {
    const post = makePost()

    post.update({ subtitle: 'Updated', petIds: ['pet-2'] })

    expect(post.subtitle).toBe('Updated')
    expect(post.petIds).toEqual(['pet-2'])
  })

  it('creates with Post.create()', () => {
    const post = Post.create({
      subtitle: 'New Post',
      authorId: 'user-1',
      petIds: [],
    })

    expect(post.subtitle).toBe('New Post')
    expect(post.authorId).toBe('user-1')
    expect(post.createdAt).toBeInstanceOf(Date)
  })
})
