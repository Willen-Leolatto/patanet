import { IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateDewormingDto {
  @IsString()
  @MaxLength(120)
  name: string

  @IsOptional()
  @IsString()
  observations?: string

  @IsOptional()
  @IsString()
  clinic?: string

  @IsOptional()
  @IsString()
  appliedAt?: string

  @IsOptional()
  @IsString()
  nextDose?: string
}
