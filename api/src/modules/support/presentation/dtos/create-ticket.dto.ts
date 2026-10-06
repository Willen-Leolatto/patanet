import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { TicketCategory } from '../../domain/entities/support-ticket'

export class CreateTicketDto {
  @IsEnum(TicketCategory)
  category: TicketCategory

  @IsString()
  @MaxLength(120)
  subject: string

  @IsString()
  message: string

  @IsOptional()
  @IsArray()
  attachments?: string[]
}
