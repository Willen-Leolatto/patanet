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

export interface CreateMedicationInput {
  animalId: string
  requesterId: string
  name: string
  startAt?: string
  endAt?: string
  dosage?: string
  frequency?: string
  clinic?: string
  observations?: string
}

@Injectable()
export class CreateMedicationUseCase {
  constructor(
    private readonly medicationRepository: MedicationRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: CreateMedicationInput): Promise<Medication> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const medication = Medication.create({
      animalId: input.animalId,
      name: input.name,
      startAt: parseYmdToDate(input.startAt),
      endAt: parseYmdToDate(input.endAt),
      dosage: input.dosage ?? null,
      frequency: input.frequency ?? null,
      clinic: input.clinic ?? null,
      observations: input.observations ?? null,
    })

    await this.medicationRepository.save(medication)
    return medication
  }
}
