import { IsArray, IsOptional, IsString } from 'class-validator'

export class SendMessageDto {
  @IsString()
  message: string

  @IsOptional()
  @IsArray()
  attachments?: string[]
}
