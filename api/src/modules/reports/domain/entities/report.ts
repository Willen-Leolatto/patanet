import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { FiniteStateMachine } from '@shared/domain/finite-state-machine'

export enum ReportStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum ReportCategory {
  GENERAL = 'GENERAL',
  CSAE = 'CSAE',
  PET_ABUSE = 'PET_ABUSE',
}

export enum ReportType {
  POST = 'POST',
  USER = 'USER',
  ANIMAL = 'ANIMAL',
  OTHER = 'OTHER',
}

// Grafo de transições válidas: uma denúncia entra em análise, é resolvida
// (procedente) ou rejeitada (improcedente); qualquer decisão pode ser
// reaberta para reanálise, mas não pula direto de RESOLVED para REJECTED
// (ou vice-versa) sem passar de novo por IN_REVIEW.
const REPORT_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.OPEN]: [
    ReportStatus.IN_REVIEW,
    ReportStatus.RESOLVED,
    ReportStatus.REJECTED,
  ],
  [ReportStatus.IN_REVIEW]: [
    ReportStatus.OPEN,
    ReportStatus.RESOLVED,
    ReportStatus.REJECTED,
  ],
  [ReportStatus.RESOLVED]: [ReportStatus.IN_REVIEW],
  [ReportStatus.REJECTED]: [ReportStatus.IN_REVIEW],
}
const reportStatusMachine = new FiniteStateMachine<ReportStatus>(
  REPORT_STATUS_TRANSITIONS,
)

export interface ReportProps {
  reporterId: string
  type: ReportType
  category: ReportCategory
  targetId: string
  message: string
  attachments: string[] | null
  status: ReportStatus
  // Wave 3 (canal de denuncias publicas): preenchidos quando a denuncia e
  // despachada a um orgao publico competente (ver ReportDispatchPort).
  dispatchedAt: Date | null
  dispatchChannel: string | null
  dispatchReference: string | null
  createdAt: Date
  updatedAt: Date
}

export class Report extends Entity<ReportProps> {
  get reporterId() {
    return this.props.reporterId
  }
  get type() {
    return this.props.type
  }
  get category() {
    return this.props.category
  }
  get targetId() {
    return this.props.targetId
  }
  get message() {
    return this.props.message
  }
  get attachments() {
    return this.props.attachments
  }
  get status() {
    return this.props.status
  }
  get dispatchedAt() {
    return this.props.dispatchedAt
  }
  get dispatchChannel() {
    return this.props.dispatchChannel
  }
  get dispatchReference() {
    return this.props.dispatchReference
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  /** Consulta pura, sem efeito colateral — quem decide o que fazer com o resultado é o use-case. */
  canTransitionTo(status: ReportStatus): boolean {
    return reportStatusMachine.canTransition(this.props.status, status)
  }

  updateStatus(status: ReportStatus): void {
    this.props.status = status
    this.props.updatedAt = new Date()
  }

  /** Registra o resultado do despacho a um orgao publico (ver ReportDispatchPort). */
  markDispatched(channel: string, reference: string | null): void {
    this.props.dispatchedAt = new Date()
    this.props.dispatchChannel = channel
    this.props.dispatchReference = reference
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<
      ReportProps,
      | 'status'
      | 'createdAt'
      | 'updatedAt'
      | 'dispatchedAt'
      | 'dispatchChannel'
      | 'dispatchReference'
    >,
    id?: UniqueEntityID,
  ): Report {
    return new Report(
      {
        ...props,
        status: ReportStatus.OPEN,
        dispatchedAt: null,
        dispatchChannel: null,
        dispatchReference: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(props: ReportProps, id: UniqueEntityID): Report {
    return new Report(props, id)
  }
}
