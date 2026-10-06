import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface SpecieProps {
  name: string
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export class Specie extends Entity<SpecieProps> {
  get name() {
    return this.props.name
  }
  get image() {
    return this.props.image
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  static reconstitute(props: SpecieProps, id: UniqueEntityID): Specie {
    return new Specie(props, id)
  }
}
