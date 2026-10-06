import { Injectable, NotFoundException } from '@nestjs/common'
import { Deworming } from '../../domain/entities/deworming'
import { DewormingRepository } from '../../domain/repositories/deworming.repository'
import { AnimalRepository } from '../../domain/repositories/animal.repository'

function parseYmdToDate(s?: string): Date | null {
  if (!s) return null
  const str = String(s).trim()
  const datePart = str.includes('T') ? str.split('T')[0] : str
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null
  return new Date(`${datePart}T00:00:00.000Z`)
}

export interface UpdateDewormingInput {
  animalId: string
  dewormingId: string
  requesterId: string
  name?: string
  observations?: string | null
  clinic?: string | null
  appliedAt?: string
  nextDose?: string
}

@Injectable()
export class UpdateDewormingUseCase {
  constructor(
    private readonly dewormingRepository: DewormingRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: UpdateDewormingInput): Promise<Deworming> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const deworming = await this.dewormingRepository.findById(input.dewormingId)
    if (!deworming || deworming.animalId !== input.animalId) {
      throw new NotFoundException('Deworming not found')
    }

    deworming.update({
      name: input.name,
      observations: input.observations,
      clinic: input.clinic,
      appliedAt:
        input.appliedAt !== undefined
          ? parseYmdToDate(input.appliedAt)
          : undefined,
      nextDose:
        input.nextDose !== undefined
          ? parseYmdToDate(input.nextDose)
          : undefined,
    })

    await this.dewormingRepository.save(deworming)
    return deworming
  }
}
