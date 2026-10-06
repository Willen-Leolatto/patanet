import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { VeterinarianAuthorization } from '../../domain/entities/veterinarian-authorization'
import { VeterinarianAuthorizationRepository } from '../../domain/repositories/veterinarian-authorization.repository'
import {
  VeterinarianProfileRepository,
} from '../../domain/repositories/veterinarian-profile.repository'
import { VeterinarianVerificationStatus } from '../../domain/entities/veterinarian-profile'

export interface AuthorizeVeterinarianInput {
  animalId: string
  requesterId: string
  veterinarianId: string
}

/**
 * Tutor autoriza formalmente um veterinario validado a atuar sobre o pet
 * (relacao medico-paciente autorizada na plataforma, ver business_rules.md
 * secao Veterinario). So depois dessa autorizacao o veterinario pode
 * registrar prontuario/vacinas oficiais (ver CreateMedicalRecordUseCase).
 */
@Injectable()
export class AuthorizeVeterinarianUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly veterinarianProfileRepository: VeterinarianProfileRepository,
    private readonly veterinarianAuthorizationRepository: VeterinarianAuthorizationRepository,
  ) {}

  async execute(
    input: AuthorizeVeterinarianInput,
  ): Promise<VeterinarianAuthorization> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    const vetProfile = await this.veterinarianProfileRepository.findByUserId(
      input.veterinarianId,
    )
    if (
      !vetProfile ||
      vetProfile.status !== VeterinarianVerificationStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Usuario informado nao e um veterinario validado',
      )
    }

    const existing =
      await this.veterinarianAuthorizationRepository.findActiveByAnimalAndVet(
        input.animalId,
        input.veterinarianId,
      )
    if (existing) return existing

    const authorization = VeterinarianAuthorization.create({
      animalId: input.animalId,
      veterinarianId: input.veterinarianId,
      authorizedById: input.requesterId,
    })
    await this.veterinarianAuthorizationRepository.save(authorization)
    return authorization
  }
}
