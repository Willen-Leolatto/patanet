import { Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class OfficialVaccineDto {
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
  batchNumber?: string

  @IsString()
  @IsOptional()
  manufacturer?: string

  @IsDateString()
  @IsOptional()
  appliedAt?: string

  @IsDateString()
  @IsOptional()
  nextDose?: string
}

export class CreateMedicalRecordDto {
  @IsString()
  @IsNotEmpty()
  notes: string

  @IsArray()
  @IsOptional()
  examRequestUrls?: string[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfficialVaccineDto)
  @IsOptional()
  vaccines?: OfficialVaccineDto[]
}
