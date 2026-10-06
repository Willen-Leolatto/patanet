import { IsNumber, IsOptional, Max, Min } from 'class-validator'
import { Type, Expose } from 'class-transformer'

export class RequestPaginationDto {
  @IsOptional()
  query?: string

  @Expose()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page: number = 1

  @Expose()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(10)
  @Max(100)
  perPage: number = 10
}
