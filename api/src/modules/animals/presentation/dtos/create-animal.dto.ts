import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { AnimalSize } from '../../domain/value-objects/animal-size'
import { AnimalGender } from '../../domain/value-objects/animal-gender'

export class CreateAnimalDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  about?: string

  @IsString()
  @IsOptional()
  image?: string

  @IsString()
  @IsOptional()
  imageCover?: string

  @IsString()
  @IsOptional()
  birthDate?: string

  @IsString()
  @IsOptional()
  adoptionDate?: string

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  weight: number

  @IsEnum(AnimalSize)
  @IsNotEmpty()
  size: AnimalSize

  @IsEnum(AnimalGender)
  @IsNotEmpty()
  gender: AnimalGender

  @IsString()
  @IsNotEmpty()
  breedId: string

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isForAdoption?: boolean
}
