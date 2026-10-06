import { Injectable, NotFoundException } from '@nestjs/common'
import { VaccineRepository } from '../../domain/repositories/vaccine.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface DeleteVaccineInput {
  animalId: string
  vaccineId: string
  requesterId: string
}

@Injectable()
export class DeleteVaccineUseCase {
  constructor(
    private readonly vaccineRepository: VaccineRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: DeleteVaccineInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const vaccine = await this.vaccineRepository.findById(input.vaccineId)
    if (!vaccine || vaccine.animalId !== input.animalId) {
      throw new NotFoundException('Vaccine not found')
    }

    await this.vaccineRepository.delete(input.vaccineId)
  }
}
