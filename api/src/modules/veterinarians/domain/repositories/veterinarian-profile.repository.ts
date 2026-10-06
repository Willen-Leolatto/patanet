import { VeterinarianProfile } from '../entities/veterinarian-profile'

export abstract class VeterinarianProfileRepository {
  abstract findById(id: string): Promise<VeterinarianProfile | null>
  abstract findByUserId(userId: string): Promise<VeterinarianProfile | null>
  abstract save(profile: VeterinarianProfile): Promise<void>
  abstract delete(id: string): Promise<void>
}
