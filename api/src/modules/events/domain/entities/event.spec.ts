import { Event } from './event'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

function makeEvent(): Event {
  return Event.reconstitute(
    {
      title: 'Dog Show',
      description: 'Annual dog show',
      date: '2024-06-01',
      time: '10:00',
      locationText: 'Central Park',
      latitude: 40.785,
      longitude: -73.968,
      imageUrl: 'https://cdn/img.jpg',
      postId: 'post-1',
      authorId: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    new UniqueEntityID('event-1'),
  )
}

describe('Event entity', () => {
  it('exposes all props via getters', () => {
    const event = makeEvent()

    expect(event.title).toBe('Dog Show')
    expect(event.description).toBe('Annual dog show')
    expect(event.date).toBe('2024-06-01')
    expect(event.time).toBe('10:00')
    expect(event.locationText).toBe('Central Park')
    expect(event.latitude).toBe(40.785)
    expect(event.longitude).toBe(-73.968)
    expect(event.imageUrl).toBe('https://cdn/img.jpg')
    expect(event.postId).toBe('post-1')
    expect(event.authorId).toBe('user-1')
    expect(event.createdAt).toBeInstanceOf(Date)
    expect(event.updatedAt).toBeInstanceOf(Date)
  })

  it('updates props with update()', () => {
    const event = makeEvent()

    event.update({
      title: 'Cat Show',
      description: 'Cat exhibition',
      date: '2024-07-01',
      time: '14:00',
      locationText: 'Broadway',
      latitude: 40.75,
      longitude: -73.99,
      imageUrl: 'https://cdn/cat.jpg',
    })

    expect(event.title).toBe('Cat Show')
    expect(event.description).toBe('Cat exhibition')
    expect(event.date).toBe('2024-07-01')
    expect(event.time).toBe('14:00')
    expect(event.locationText).toBe('Broadway')
    expect(event.latitude).toBe(40.75)
    expect(event.longitude).toBe(-73.99)
    expect(event.imageUrl).toBe('https://cdn/cat.jpg')
  })

  it('sets postId with setPostId()', () => {
    const event = makeEvent()

    event.setPostId('post-99')

    expect(event.postId).toBe('post-99')
  })

  it('creates with Event.create()', () => {
    const event = Event.create({
      title: 'New Event',
      authorId: 'user-2',
    })

    expect(event.title).toBe('New Event')
    expect(event.authorId).toBe('user-2')
    expect(event.createdAt).toBeInstanceOf(Date)
  })
})
