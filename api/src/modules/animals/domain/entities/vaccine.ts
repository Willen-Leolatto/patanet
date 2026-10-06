import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export interface VaccineProps {
  name: string
  observations: string
  clinic: string
  appliedAt: Date | null
  nextDose: Date | null
  animalId: string
  // Wave 3 (modulo Veterinario): preenchidos quando a vacina e lancada por
  // um veterinario com VeterinarianAuthorization ativa pro pet (ver
  // CreateMedicalRecordUseCase) -- so ai isOfficial fica true.
  isOfficial: boolean
  batchNumber: string | null
  manufacturer: string | null
  veterinarianId: string | null
  createdAt: Date
  updatedAt: Date
}

export class Vaccine extends Entity<VaccineProps> {
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
  get isOfficial() {
    return this.props.isOfficial
  }
  get batchNumber() {
    return this.props.batchNumber
  }
  get manufacturer() {
    return this.props.manufacturer
  }
  get veterinarianId() {
    return this.props.veterinarianId
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
        VaccineProps,
        'name' | 'observations' | 'clinic' | 'appliedAt' | 'nextDose'
      >
    >,
  ): void {
    Object.assign(this.props, data)
    this.props.updatedAt = new Date()
  }

  static create(
    props: Omit<
      VaccineProps,
      'createdAt' | 'updatedAt' | 'isOfficial' | 'batchNumber' | 'manufacturer' | 'veterinarianId'
    > &
      Partial<
        Pick<
          VaccineProps,
          'isOfficial' | 'batchNumber' | 'manufacturer' | 'veterinarianId'
        >
      >,
    id?: UniqueEntityID,
  ): Vaccine {
    return new Vaccine(
      {
        ...props,
        isOfficial: props.isOfficial ?? false,
        batchNumber: props.batchNumber ?? null,
        manufacturer: props.manufacturer ?? null,
        veterinarianId: props.veterinarianId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(props: VaccineProps, id: UniqueEntityID): Vaccine {
    return new Vaccine(props, id)
  }
}
