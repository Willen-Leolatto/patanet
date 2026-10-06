import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export interface AnimalMediaProps {
  text: string | null
  path: string
  type: MediaType
  animalId: string
  createdAt: Date
  updatedAt: Date
}

export class AnimalMedia extends Entity<AnimalMediaProps> {
  get text() {
    return this.props.text
  }
  get path() {
    return this.props.path
  }
  get type() {
    return this.props.type
  }
  get animalId() {
    return this.props.animalId
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  static create(
    props: Omit<AnimalMediaProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): AnimalMedia {
    return new AnimalMedia(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(
    props: AnimalMediaProps,
    id: UniqueEntityID,
  ): AnimalMedia {
    return new AnimalMedia(props, id)
  }
}
