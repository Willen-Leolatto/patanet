import { VeterinarianProfile } from '../../domain/entities/veterinarian-profile'

export class ResponseVeterinarianProfileDto {
  readonly id: string
  readonly userId: string
  readonly crmv: string
  readonly uf: string
  readonly status: string
  readonly documentUrls: string[] | null
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(profile: VeterinarianProfile) {
    this.id = profile.id.toValue()
    this.userId = profile.userId
    this.crmv = profile.crmv
    this.uf = profile.uf
    this.status = profile.status
    this.documentUrls = profile.documentUrls
    this.createdAt = profile.createdAt
    this.updatedAt = profile.updatedAt
  }
}
