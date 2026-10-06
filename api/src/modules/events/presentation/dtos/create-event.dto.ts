import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateEventDto {
  @IsString()
  @MaxLength(120)
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string

  @IsOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @IsString()
  @MaxLength(10)
  time?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationText?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number
}
