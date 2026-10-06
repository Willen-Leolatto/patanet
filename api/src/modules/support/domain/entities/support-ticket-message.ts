import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface SupportTicketMessageProps {
  ticketId: string
  authorId: string | null
  message: string
  attachments: string[] | null
  createdAt: Date
}

export class SupportTicketMessage extends Entity<SupportTicketMessageProps> {
  get ticketId() {
    return this.props.ticketId
  }
  get authorId() {
    return this.props.authorId
  }
  get message() {
    return this.props.message
  }
  get attachments() {
    return this.props.attachments
  }
  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Omit<SupportTicketMessageProps, 'createdAt'>,
    id?: UniqueEntityID,
  ): SupportTicketMessage {
    return new SupportTicketMessage({ ...props, createdAt: new Date() }, id)
  }

  static reconstitute(
    props: SupportTicketMessageProps,
    id: UniqueEntityID,
  ): SupportTicketMessage {
    return new SupportTicketMessage(props, id)
  }
}
