import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface MedicalRecordProps {
  animalId: string
  veterinarianId: string
  notes: string
  examRequestUrls: string[] | null
  signedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class MedicalRecord extends Entity<MedicalRecordProps> {
  get animalId() {
    return this.props.animalId
  }
  get veterinarianId() {
    return this.props.veterinarianId
  }
  get notes() {
    return this.props.notes
  }
  get examRequestUrls() {
    return this.props.examRequestUrls
  }
  get signedAt() {
    return this.props.signedAt
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  static create(
    props: Omit<MedicalRecordProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): MedicalRecord {
    return new MedicalRecord(
      { ...props, createdAt: new Date(), updatedAt: new Date() },
      id,
    )
  }

  static reconstitute(
    props: MedicalRecordProps,
    id: UniqueEntityID,
  ): MedicalRecord {
    return new MedicalRecord(props, id)
  }
}
