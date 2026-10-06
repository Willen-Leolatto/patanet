import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { ReportCategory, ReportType } from '../../domain/entities/report'

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType

  @IsEnum(ReportCategory)
  category: ReportCategory

  @IsString()
  @MaxLength(64)
  targetId: string

  @IsString()
  message: string

  @IsOptional()
  @IsArray()
  attachments?: string[]
}
