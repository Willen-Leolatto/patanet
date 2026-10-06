import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import { SkipTermsCheck } from '@shared/presentation/decorators/skip-terms-check.decorator'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { GetSpeciesUseCase } from '../../application/use-cases/get-species.use-case'

@SkipTermsCheck()
@UseGuards(AuthGuard)
@Controller('animals/species')
export class SpeciesController {
  constructor(private readonly getSpeciesUseCase: GetSpeciesUseCase) {}

  @Get()
  async species(@Query() query: RequestPaginationDto) {
    const { page = 1, perPage = 10, query: q } = query
    const { items, total } = await this.getSpeciesUseCase.execute({
      query: q,
      page,
      perPage,
    })
    return new ResponsePaginationDto(
      items.map(s => ({
        id: s.id.toValue(),
        name: s.name,
        image: s.image,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      { page, perPage, pages: Math.ceil(total / perPage), total },
    )
  }
}
