import { IsOptional, IsString } from 'class-validator'

export class CreateAdoptionRequestDto {
  @IsString()
  @IsOptional()
  message?: string

  @IsString()
  @IsOptional()
  signatureName?: string

  @IsString()
  @IsOptional()
  termVersion?: string
}
