import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { UserRole } from '@modules/users/domain/entities/user'
import {
  VeterinarianProfile,
  VeterinarianVerificationStatus,
} from '../../domain/entities/veterinarian-profile'
import { VeterinarianProfileRepository } from '../../domain/repositories/veterinarian-profile.repository'

export interface ReviewVeterinarianApplicationInput {
  profileId: string
  status: VeterinarianVerificationStatus
}

@Injectable()
export class ReviewVeterinarianApplicationUseCase {
  constructor(
    private readonly veterinarianProfileRepository: VeterinarianProfileRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ReviewVeterinarianApplicationInput,
  ): Promise<VeterinarianProfile> {
    const profile = await this.veterinarianProfileRepository.findById(
      input.profileId,
    )
    if (!profile) throw new NotFoundException('Veterinarian profile not found')

    profile.updateStatus(input.status)
    await this.veterinarianProfileRepository.save(profile)

    if (input.status === VeterinarianVerificationStatus.APPROVED) {
      const user = await this.userRepository.findById(profile.userId)
      if (user) {
        user.changeRole(UserRole.VETERINARIAN)
        await this.userRepository.save(user)
      }
    }

    return profile
  }
}
