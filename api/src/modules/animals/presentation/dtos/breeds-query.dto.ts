import { IsOptional, IsString } from 'class-validator'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'

export class BreedsQueryDto extends RequestPaginationDto {
  @IsOptional()
  @IsString()
  specieId?: string
}
