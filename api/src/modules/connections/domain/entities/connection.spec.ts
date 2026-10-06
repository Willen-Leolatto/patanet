import { Connection } from './connection'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Connection entity', () => {
  it('exposes all props via getters', () => {
    const connection = Connection.reconstitute(
      {
        followerId: 'user-1',
        followingId: 'user-2',
        createdAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('connection-1'),
    )

    expect(connection.followerId).toBe('user-1')
    expect(connection.followingId).toBe('user-2')
    expect(connection.createdAt).toBeInstanceOf(Date)
  })

  it('creates with Connection.create()', () => {
    const connection = Connection.create({
      followerId: 'user-1',
      followingId: 'user-2',
    })

    expect(connection.followerId).toBe('user-1')
    expect(connection.followingId).toBe('user-2')
    expect(connection.createdAt).toBeInstanceOf(Date)
  })
})
