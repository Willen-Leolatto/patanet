import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  subtitle: string

  @IsArray()
  @IsOptional()
  pets?: string[]
}
