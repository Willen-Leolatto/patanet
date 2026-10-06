import { Injectable, NotFoundException } from '@nestjs/common'
import { MedicationRepository } from '../../domain/repositories/medication.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface DeleteMedicationInput {
  animalId: string
  medicationId: string
  requesterId: string
}

@Injectable()
export class DeleteMedicationUseCase {
  constructor(
    private readonly medicationRepository: MedicationRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: DeleteMedicationInput): Promise<void> {
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

    await this.medicationRepository.delete(input.medicationId)
  }
}
