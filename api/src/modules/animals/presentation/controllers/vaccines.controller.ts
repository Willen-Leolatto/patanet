import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { BreedsQueryDto } from '../dtos/breeds-query.dto'
import { CreateVaccineDto } from '../dtos/create-vaccine.dto'
import { UpdateVaccineDto } from '../dtos/update-vaccine.dto'
import { CreateVaccineUseCase } from '../../application/use-cases/create-vaccine.use-case'
import { UpdateVaccineUseCase } from '../../application/use-cases/update-vaccine.use-case'
import { DeleteVaccineUseCase } from '../../application/use-cases/delete-vaccine.use-case'
import { GetVaccinesUseCase } from '../../application/use-cases/get-vaccines.use-case'

@UseGuards(AuthGuard)
@Controller('animals')
export class VaccinesController {
  constructor(
    private readonly createVaccineUseCase: CreateVaccineUseCase,
    private readonly updateVaccineUseCase: UpdateVaccineUseCase,
    private readonly deleteVaccineUseCase: DeleteVaccineUseCase,
    private readonly getVaccinesUseCase: GetVaccinesUseCase,
  ) {}

  @Post('vaccines/:animalId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('media'))
  async addVaccine(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Body() dto: CreateVaccineDto,
  ) {
    await this.createVaccineUseCase.execute({
      ...dto,
      animalId,
      requesterId: req.user.id,
    })
  }

  @Patch(':animalId/vaccines/:vaccineId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('media'))
  async updateVaccine(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('vaccineId') vaccineId: string,
    @Body() dto: UpdateVaccineDto,
  ) {
    await this.updateVaccineUseCase.execute({
      ...dto,
      animalId,
      vaccineId,
      requesterId: req.user.id,
    })
  }

  @Delete(':animalId/vaccines/:vaccineId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('media'))
  async removeVaccine(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('vaccineId') vaccineId: string,
  ) {
    await this.deleteVaccineUseCase.execute({
      animalId,
      vaccineId,
      requesterId: req.user.id,
    })
  }

  @Get('vaccines/:animalId')
  async list(
    @Param('animalId') animalId: string,
    @Query() query: BreedsQueryDto,
  ) {
    const { page = 1, perPage = 10 } = query
    const { items, total } = await this.getVaccinesUseCase.execute({
      animalId,
      page,
      perPage,
    })
    return new ResponsePaginationDto(
      items.map(v => ({
        id: v.id.toValue(),
        name: v.name,
        observations: v.observations,
        clinic: v.clinic,
        appliedAt: v.appliedAt,
        nextDose: v.nextDose,
        animalId: v.animalId,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      { page, perPage, pages: Math.ceil(total / perPage), total },
    )
  }
}
