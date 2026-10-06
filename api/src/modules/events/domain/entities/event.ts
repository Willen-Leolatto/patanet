import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface EventProps {
  title: string
  description?: string | null
  date?: string | null
  time?: string | null
  locationText?: string | null
  latitude?: number | null
  longitude?: number | null
  imageUrl?: string | null
  postId?: string | null
  authorId: string
  capacity?: number | null
  createdAt: Date
  updatedAt: Date
}

export class Event extends Entity<EventProps> {
  get title() {
    return this.props.title
  }
  get description() {
    return this.props.description
  }
  get date() {
    return this.props.date
  }
  get time() {
    return this.props.time
  }
  get locationText() {
    return this.props.locationText
  }
  get latitude() {
    return this.props.latitude
  }
  get longitude() {
    return this.props.longitude
  }
  get imageUrl() {
    return this.props.imageUrl
  }
  get postId() {
    return this.props.postId
  }
  get authorId() {
    return this.props.authorId
  }
  get capacity() {
    return this.props.capacity
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  setPostId(postId: string): void {
    this.props.postId = postId
    this.props.updatedAt = new Date()
  }

  update(
    data: Partial<
      Pick<
        EventProps,
        | 'title'
        | 'description'
        | 'date'
        | 'time'
        | 'locationText'
        | 'latitude'
        | 'longitude'
        | 'imageUrl'
        | 'capacity'
      >
    >,
  ): void {
    if (data.title !== undefined) this.props.title = data.title
    if (data.description !== undefined)
      this.props.description = data.description
    if (data.date !== undefined) this.props.date = data.date
    if (data.time !== undefined) this.props.time = data.time
    if (data.locationText !== undefined)
      this.props.locationText = data.locationText
    if (data.latitude !== undefined) this.props.latitude = data.latitude
    if (data.longitude !== undefined) this.props.longitude = data.longitude
    if (data.imageUrl !== undefined) this.props.imageUrl = data.imageUrl
    if (data.capacity !== undefined) this.props.capacity = data.capacity
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<EventProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Event {
    return new Event(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(props: EventProps, id: UniqueEntityID): Event {
    return new Event(props, id)
  }
}
