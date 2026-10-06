import { IsNotEmpty, IsString } from 'class-validator'

export class GoogleSignInDto {
  @IsString()
  @IsNotEmpty()
  idToken: string
}
