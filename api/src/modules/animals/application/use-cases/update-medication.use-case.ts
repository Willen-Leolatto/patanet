import { Injectable, NotFoundException } from '@nestjs/common'
import { Medication } from '../../domain/entities/medication'
import { MedicationRepository } from '../../domain/repositories/medication.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

function parseYmdToDate(s?: string): Date | null {
  if (!s) return null
  const str = String(s).trim()
  const datePart = str.includes('T') ? str.split('T')[0] : str
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null
  return new Date(`${datePart}T00:00:00.000Z`)
}

export interface UpdateMedicationInput {
  animalId: string
  medicationId: string
  requesterId: string
  name?: string
  startAt?: string
  endAt?: string
  dosage?: string | null
  frequency?: string | null
  clinic?: string | null
  observations?: string | null
}

@Injectable()
export class UpdateMedicationUseCase {
  constructor(
    private readonly medicationRepository: MedicationRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: UpdateMedicationInput): Promise<Medication> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const medication = await this.medicationRepository.findById(
      input.medicationId,
    )
    if (!medication || medication.animalId !== input.animalId) {
      throw new NotFoundException('Medication not found')
    }

    medication.update({
      name: input.name,
      startAt:
        input.startAt !== undefined ? parseYmdToDate(input.startAt) : undefined,
      endAt:
        input.endAt !== undefined ? parseYmdToDate(input.endAt) : undefined,
      dosage: input.dosage,
      frequency: input.frequency,
      clinic: input.clinic,
      observations: input.observations,
    })

    await this.medicationRepository.save(medication)
    return medication
  }
}
