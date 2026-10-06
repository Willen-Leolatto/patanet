import { AggregateRoot } from '@shared/domain/aggregate-root'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { FiniteStateMachine } from '@shared/domain/finite-state-machine'

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketCategory {
  GENERAL = 'GENERAL',
  PRIVACY = 'PRIVACY',
  ACCOUNT_DELETION = 'ACCOUNT_DELETION',
  OTHER = 'OTHER',
}

// Grafo de transições válidas: um ticket entra em atendimento, é resolvido
// e então fechado; pode ser reaberto (para IN_REVIEW) a partir de qualquer
// estado posterior a OPEN, inclusive depois de fechado (ex.: usuário
// responde de novo um ticket já encerrado).
const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [
    TicketStatus.IN_REVIEW,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ],
  [TicketStatus.IN_REVIEW]: [
    TicketStatus.OPEN,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_REVIEW],
  [TicketStatus.CLOSED]: [TicketStatus.IN_REVIEW],
}
const ticketStatusMachine = new FiniteStateMachine<TicketStatus>(
  TICKET_STATUS_TRANSITIONS,
)

export interface SupportTicketProps {
  authorId: string
  category: TicketCategory
  subject: string
  status: TicketStatus
  createdAt: Date
  updatedAt: Date
}

export class SupportTicket extends AggregateRoot<SupportTicketProps> {
  get authorId() {
    return this.props.authorId
  }
  get category() {
    return this.props.category
  }
  get subject() {
    return this.props.subject
  }
  get status() {
    return this.props.status
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  /** Consulta pura, sem efeito colateral — quem decide o que fazer com o resultado é o use-case. */
  canTransitionTo(status: TicketStatus): boolean {
    return ticketStatusMachine.canTransition(this.props.status, status)
  }

  updateStatus(status: TicketStatus): void {
    this.props.status = status
    this.props.updatedAt = new Date()
  }

  bumpUpdatedAt(): void {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<SupportTicketProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): SupportTicket {
    return new SupportTicket(
      {
        ...props,
        status: TicketStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(
    props: SupportTicketProps,
    id: UniqueEntityID,
  ): SupportTicket {
    return new SupportTicket(props, id)
  }
}
