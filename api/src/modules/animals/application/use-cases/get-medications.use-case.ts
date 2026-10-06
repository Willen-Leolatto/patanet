import { Injectable } from '@nestjs/common'
import { Medication } from '../../domain/entities/medication'
import { MedicationRepository } from '../../domain/repositories/medication.repository'

export interface GetMedicationsInput {
  animalId: string
}

@Injectable()
export class GetMedicationsUseCase {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(input: GetMedicationsInput): Promise<Medication[]> {
    return this.medicationRepository.findByAnimal(input.animalId)
  }
}
