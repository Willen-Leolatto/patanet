import { UniqueEntityID } from '../unique-entity-id'

export interface DomainEvent {
  occurredAt: Date
  getAggregateId(): UniqueEntityID
}
