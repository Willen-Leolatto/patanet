import { Injectable, NotFoundException } from '@nestjs/common'
import { Vaccine } from '../../domain/entities/vaccine'
import { VaccineRepository } from '../../domain/repositories/vaccine.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

export interface CreateVaccineInput {
  animalId: string
  requesterId: string
  name: string
  observations?: string
  clinic: string
  appliedAt?: string
  nextDose?: string
}

@Injectable()
export class CreateVaccineUseCase {
  constructor(
    private readonly vaccineRepository: VaccineRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: CreateVaccineInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const vaccine = Vaccine.create({
      animalId: input.animalId,
      name: input.name,
      observations: input.observations ?? '',
      clinic: input.clinic,
      appliedAt: input.appliedAt ? new Date(input.appliedAt) : null,
      nextDose: input.nextDose ? new Date(input.nextDose) : null,
    })

    await this.vaccineRepository.save(vaccine)
  }
}
