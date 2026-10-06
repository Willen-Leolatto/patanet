import { Injectable, NotFoundException } from '@nestjs/common'
import { VaccineRepository } from '../../domain/repositories/vaccine.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface UpdateVaccineInput {
  animalId: string
  vaccineId: string
  requesterId: string
  name?: string
  observations?: string
  clinic?: string
  appliedAt?: string
  nextDose?: string
}

@Injectable()
export class UpdateVaccineUseCase {
  constructor(
    private readonly vaccineRepository: VaccineRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: UpdateVaccineInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const vaccine = await this.vaccineRepository.findById(input.vaccineId)
    if (!vaccine || vaccine.animalId !== input.animalId) {
      throw new NotFoundException('Vaccine not found')
    }

    vaccine.update({
      name: input.name,
      observations: input.observations,
      clinic: input.clinic,
      appliedAt:
        input.appliedAt !== undefined
          ? input.appliedAt
            ? new Date(input.appliedAt)
            : null
          : undefined,
      nextDose:
        input.nextDose !== undefined
          ? input.nextDose
            ? new Date(input.nextDose)
            : null
          : undefined,
    })

    await this.vaccineRepository.save(vaccine)
  }
}
