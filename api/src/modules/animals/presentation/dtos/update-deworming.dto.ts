import { PartialType } from '@nestjs/mapped-types'
import { CreateDewormingDto } from './create-deworming.dto'

export class UpdateDewormingDto extends PartialType(CreateDewormingDto) {}
