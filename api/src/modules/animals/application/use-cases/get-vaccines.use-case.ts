import { Injectable } from '@nestjs/common'
import { Vaccine } from '../../domain/entities/vaccine'
import { VaccineRepository } from '../../domain/repositories/vaccine.repository'

export interface GetVaccinesInput {
  animalId: string
  page: number
  perPage: number
}

@Injectable()
export class GetVaccinesUseCase {
  constructor(private readonly vaccineRepository: VaccineRepository) {}

  async execute(
    input: GetVaccinesInput,
  ): Promise<{ items: Vaccine[]; total: number }> {
    return this.vaccineRepository.findByAnimal(input.animalId, {
      page: input.page,
      perPage: input.perPage,
    })
  }
}
