import { AdoptionRequest } from '../entities/adoption-request'

export abstract class AdoptionRequestRepository {
  abstract findById(id: string): Promise<AdoptionRequest | null>
  abstract findByAnimalId(animalId: string): Promise<AdoptionRequest[]>
  abstract save(request: AdoptionRequest): Promise<void>
}
