import { OmitType, PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { CreateUserDto } from './create-user.dto'

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password']),
) {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  displayName?: string

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(500)
  about?: string

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  imageCover?: string
}
