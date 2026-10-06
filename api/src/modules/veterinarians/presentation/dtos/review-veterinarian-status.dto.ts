import { IsEnum } from 'class-validator'
import { VeterinarianVerificationStatus } from '../../domain/entities/veterinarian-profile'

export class ReviewVeterinarianStatusDto {
  @IsEnum(VeterinarianVerificationStatus)
  status: VeterinarianVerificationStatus
}
