import { IsNotEmpty, IsString } from 'class-validator'

export class RegisterAdoptableAnimalDto {
  @IsString()
  @IsNotEmpty()
  animalId: string
}
