import { IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateMedicationDto {
  @IsString()
  @MaxLength(255)
  name: string

  @IsOptional()
  @IsString()
  startAt?: string

  @IsOptional()
  @IsString()
  endAt?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  dosage?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  frequency?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clinic?: string

  @IsOptional()
  @IsString()
  observations?: string
}
