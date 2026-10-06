import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import { SkipTermsCheck } from '@shared/presentation/decorators/skip-terms-check.decorator'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { BreedsQueryDto } from '../dtos/breeds-query.dto'
import { GetBreedsUseCase } from '../../application/use-cases/get-breeds.use-case'

@SkipTermsCheck()
@UseGuards(AuthGuard)
@Controller('animals/breeds')
export class BreedsController {
  constructor(private readonly getBreedsUseCase: GetBreedsUseCase) {}

  @Get()
  async breeds(@Query() query: BreedsQueryDto) {
    const { page = 1, perPage = 10, query: q, specieId } = query
    const { items, total } = await this.getBreedsUseCase.execute({
      query: q,
      specieId,
      page,
      perPage,
    })
    return new ResponsePaginationDto(
      items.map(b => ({
        id: b.id.toValue(),
        name: b.name,
        about: b.about,
        appearance: b.appearance,
        temperament: b.temperament,
        trainability: b.trainability,
        exercise: b.exercise,
        coat: b.coat,
        health: b.health,
        suggestedSize: b.suggestedSize,
        typicalWeight: b.typicalWeight,
        typicalHeight: b.typicalHeight,
        lifeExpectancy: b.lifeExpectancy,
        image: b.image,
        specieId: b.specieId,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        specie: b.specie,
      })),
      { page, perPage, pages: Math.ceil(total / perPage), total },
    )
  }
}
