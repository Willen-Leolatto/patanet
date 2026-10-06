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

export interface CreateDewormingInput {
  animalId: string
  requesterId: string
  name: string
  observations?: string
  clinic?: string
  appliedAt?: string
  nextDose?: string
}

@Injectable()
export class CreateDewormingUseCase {
  constructor(
    private readonly dewormingRepository: DewormingRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: CreateDewormingInput): Promise<Deworming> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const deworming = Deworming.create({
      animalId: input.animalId,
      name: input.name,
      observations: input.observations ?? null,
      clinic: input.clinic ?? null,
      appliedAt: parseYmdToDate(input.appliedAt),
      nextDose: parseYmdToDate(input.nextDose),
    })

    await this.dewormingRepository.save(deworming)
    return deworming
  }
}
