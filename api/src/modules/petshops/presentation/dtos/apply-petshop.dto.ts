import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ApplyPetshopDto {
  @IsString()
  @IsNotEmpty()
  cnpj: string

  @IsString()
  @IsNotEmpty()
  businessName: string

  @IsString()
  @IsOptional()
  responsavelTecnicoNome?: string

  @IsString()
  @IsOptional()
  addressLine?: string

  @IsString()
  @IsOptional()
  addressCity?: string

  @IsString()
  @IsOptional()
  addressState?: string
}
