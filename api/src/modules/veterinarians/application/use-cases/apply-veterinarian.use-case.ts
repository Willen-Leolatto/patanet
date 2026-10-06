import { ConflictException, Injectable } from '@nestjs/common'
import { VeterinarianProfile } from '../../domain/entities/veterinarian-profile'
import { VeterinarianProfileRepository } from '../../domain/repositories/veterinarian-profile.repository'

export interface ApplyVeterinarianInput {
  userId: string
  crmv: string
  uf: string
  documentUrls: string[]
}

@Injectable()
export class ApplyVeterinarianUseCase {
  constructor(
    private readonly veterinarianProfileRepository: VeterinarianProfileRepository,
  ) {}

  async execute(input: ApplyVeterinarianInput): Promise<VeterinarianProfile> {
    const existing = await this.veterinarianProfileRepository.findByUserId(
      input.userId,
    )
    if (existing) {
      throw new ConflictException(
        'Ja existe uma solicitacao de veterinario para este usuario',
      )
    }

    const profile = VeterinarianProfile.create({
      userId: input.userId,
      crmv: input.crmv,
      uf: input.uf,
      documentUrls: input.documentUrls,
    })
    await this.veterinarianProfileRepository.save(profile)
    return profile
  }
}
