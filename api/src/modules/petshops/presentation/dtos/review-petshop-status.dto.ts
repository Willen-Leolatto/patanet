import { IsEnum } from 'class-validator'
import { PetshopVerificationStatus } from '../../domain/entities/petshop'

export class ReviewPetshopStatusDto {
  @IsEnum(PetshopVerificationStatus)
  status: PetshopVerificationStatus
}
