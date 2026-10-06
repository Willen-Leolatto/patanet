import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export enum AttendanceStatus {
  CONFIRMED = 'CONFIRMED',
  WAITLIST = 'WAITLIST',
}

export interface EventAttendanceProps {
  eventId: string
  userId: string
  status: AttendanceStatus
  createdAt: Date
}

export class EventAttendance extends Entity<EventAttendanceProps> {
  get eventId() {
    return this.props.eventId
  }
  get userId() {
    return this.props.userId
  }
  get status() {
    return this.props.status
  }
  get createdAt() {
    return this.props.createdAt
  }

  confirm(): void {
    this.props.status = AttendanceStatus.CONFIRMED
  }

  static create(
    props: Omit<EventAttendanceProps, 'createdAt' | 'status'> &
      Partial<Pick<EventAttendanceProps, 'status'>>,
    id?: UniqueEntityID,
  ): EventAttendance {
    return new EventAttendance(
      {
        ...props,
        status: props.status ?? AttendanceStatus.CONFIRMED,
        createdAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(
    props: EventAttendanceProps,
    id: UniqueEntityID,
  ): EventAttendance {
    return new EventAttendance(props, id)
  }
}
