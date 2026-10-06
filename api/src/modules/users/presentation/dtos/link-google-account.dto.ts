import { IsNotEmpty, IsString } from 'class-validator'

export class LinkGoogleAccountDto {
  @IsString()
  @IsNotEmpty()
  idToken: string
}
