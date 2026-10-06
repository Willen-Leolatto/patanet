import { IsNotEmpty, IsString, Length } from 'class-validator'

export class ApplyVeterinarianDto {
  @IsString()
  @IsNotEmpty()
  crmv: string

  @IsString()
  @Length(2, 2)
  uf: string
}
