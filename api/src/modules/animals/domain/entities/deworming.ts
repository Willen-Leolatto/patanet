import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface DewormingProps {
  name: string
  observations: string | null
  clinic: string | null
  appliedAt: Date | null
  nextDose: Date | null
  animalId: string
  createdAt: Date
  updatedAt: Date
}

export class Deworming extends Entity<DewormingProps> {
  get name() {
    return this.props.name
  }
  get observations() {
    return this.props.observations
  }
  get clinic() {
    return this.props.clinic
  }
  get appliedAt() {
    return this.props.appliedAt
  }
  get nextDose() {
    return this.props.nextDose
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

  update(
    data: Partial<
      Pick<
        DewormingProps,
        'name' | 'observations' | 'clinic' | 'appliedAt' | 'nextDose'
      >
    >,
  ): void {
    Object.assign(this.props, data)
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<DewormingProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Deworming {
    return new Deworming(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(props: DewormingProps, id: UniqueEntityID): Deworming {
    return new Deworming(props, id)
  }
}
