import { VeterinarianAuthorization } from '../entities/veterinarian-authorization'

export abstract class VeterinarianAuthorizationRepository {
  abstract findActiveByAnimalAndVet(
    animalId: string,
    veterinarianId: string,
  ): Promise<VeterinarianAuthorization | null>
  abstract findByAnimalId(
    animalId: string,
  ): Promise<VeterinarianAuthorization[]>
  abstract save(authorization: VeterinarianAuthorization): Promise<void>
}
