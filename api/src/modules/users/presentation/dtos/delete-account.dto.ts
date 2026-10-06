import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class DeleteAccountDto {
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string
}
