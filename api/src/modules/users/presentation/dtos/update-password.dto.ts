import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdatePasswordDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currentPassword?: string

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string
}
