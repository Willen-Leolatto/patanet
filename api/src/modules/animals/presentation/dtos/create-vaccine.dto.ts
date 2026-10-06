import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateVaccineDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  observations?: string

  @IsString()
  @IsNotEmpty()
  clinic: string

  @IsString()
  @IsOptional()
  appliedAt?: string

  @IsString()
  @IsOptional()
  nextDose?: string

  @IsString()
  @IsOptional()
  vetName?: string

  @IsString()
  @IsOptional()
  crmv?: string

  @IsString()
  @IsOptional()
  crmvUf?: string

  @IsString()
  @IsOptional()
  batchNumber?: string
}
