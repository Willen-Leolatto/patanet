import { IsNotEmpty, IsString } from 'class-validator'

export class AuthorizeVeterinarianDto {
  @IsString()
  @IsNotEmpty()
  veterinarianId: string
}
