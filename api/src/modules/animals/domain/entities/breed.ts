import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface SpecieSummary {
  id: string
  name: string
  image: string | null
}

export interface BreedProps {
  name: string
  about: string | null
  appearance: string | null
  temperament: string | null
  trainability: string | null
  exercise: string | null
  coat: string | null
  health: string | null
  suggestedSize: string | null
  typicalWeight: string | null
  typicalHeight: string | null
  lifeExpectancy: string | null
  image: string | null
  specieId: string
  createdAt: Date
  updatedAt: Date
  specie?: SpecieSummary
}

export class Breed extends Entity<BreedProps> {
  get name() {
    return this.props.name
  }
  get about() {
    return this.props.about
  }
  get appearance() {
    return this.props.appearance
  }
  get temperament() {
    return this.props.temperament
  }
  get trainability() {
    return this.props.trainability
  }
  get exercise() {
    return this.props.exercise
  }
  get coat() {
    return this.props.coat
  }
  get health() {
    return this.props.health
  }
  get suggestedSize() {
    return this.props.suggestedSize
  }
  get typicalWeight() {
    return this.props.typicalWeight
  }
  get typicalHeight() {
    return this.props.typicalHeight
  }
  get lifeExpectancy() {
    return this.props.lifeExpectancy
  }
  get image() {
    return this.props.image
  }
  get specieId() {
    return this.props.specieId
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }
  get specie() {
    return this.props.specie
  }

  static reconstitute(props: BreedProps, id: UniqueEntityID): Breed {
    return new Breed(props, id)
  }
}
