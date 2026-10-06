import { Injectable } from '@nestjs/common'
import { Deworming } from '../../domain/entities/deworming'
import { DewormingRepository } from '../../domain/repositories/deworming.repository'

export interface GetDewormingsInput {
  animalId: string
}

@Injectable()
export class GetDewormingsUseCase {
  constructor(private readonly dewormingRepository: DewormingRepository) {}

  async execute(input: GetDewormingsInput): Promise<Deworming[]> {
    return this.dewormingRepository.findByAnimal(input.animalId)
  }
}
