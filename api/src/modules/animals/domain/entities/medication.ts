import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface MedicationProps {
  name: string
  startAt: Date | null
  endAt: Date | null
  dosage: string | null
  frequency: string | null
  clinic: string | null
  observations: string | null
  animalId: string
  createdAt: Date
  updatedAt: Date
}

export class Medication extends Entity<MedicationProps> {
  get name() {
    return this.props.name
  }
  get startAt() {
    return this.props.startAt
  }
  get endAt() {
    return this.props.endAt
  }
  get dosage() {
    return this.props.dosage
  }
  get frequency() {
    return this.props.frequency
  }
  get clinic() {
    return this.props.clinic
  }
  get observations() {
    return this.props.observations
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
        MedicationProps,
        | 'name'
        | 'startAt'
        | 'endAt'
        | 'dosage'
        | 'frequency'
        | 'clinic'
        | 'observations'
      >
    >,
  ): void {
    Object.assign(this.props, data)
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<MedicationProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Medication {
    return new Medication(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(props: MedicationProps, id: UniqueEntityID): Medication {
    return new Medication(props, id)
  }
}
