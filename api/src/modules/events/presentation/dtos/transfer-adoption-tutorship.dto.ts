import { IsNotEmpty, IsString } from 'class-validator'

export class TransferAdoptionTutorshipDto {
  @IsString()
  @IsNotEmpty()
  newOwnerId: string
}
