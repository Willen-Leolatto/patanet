import { IsEnum } from 'class-validator'
import { TicketStatus } from '../../domain/entities/support-ticket'

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus
}
