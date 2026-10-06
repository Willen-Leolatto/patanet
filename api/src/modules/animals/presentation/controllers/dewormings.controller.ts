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
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { CreateDewormingDto } from '../dtos/create-deworming.dto'
import { UpdateDewormingDto } from '../dtos/update-deworming.dto'
import { CreateDewormingUseCase } from '../../application/use-cases/create-deworming.use-case'
import { UpdateDewormingUseCase } from '../../application/use-cases/update-deworming.use-case'
import { DeleteDewormingUseCase } from '../../application/use-cases/delete-deworming.use-case'
import { GetDewormingsUseCase } from '../../application/use-cases/get-dewormings.use-case'

@UseGuards(AuthGuard)
@Controller('animals')
export class DewormingsController {
  constructor(
    private readonly createDewormingUseCase: CreateDewormingUseCase,
    private readonly updateDewormingUseCase: UpdateDewormingUseCase,
    private readonly deleteDewormingUseCase: DeleteDewormingUseCase,
    private readonly getDewormingsUseCase: GetDewormingsUseCase,
  ) {}

  @Post('dewormings/:animalId')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Body() dto: CreateDewormingDto,
  ) {
    const deworming = await this.createDewormingUseCase.execute({
      ...dto,
      animalId,
      requesterId: req.user.id,
    })
    return {
      id: deworming.id.toValue(),
      name: deworming.name,
      observations: deworming.observations,
      clinic: deworming.clinic,
      appliedAt: deworming.appliedAt,
      nextDose: deworming.nextDose,
      animalId: deworming.animalId,
      createdAt: deworming.createdAt,
      updatedAt: deworming.updatedAt,
    }
  }

  @Get('dewormings/:animalId')
  async list(@Param('animalId') animalId: string) {
    const items = await this.getDewormingsUseCase.execute({ animalId })
    return items.map(d => ({
      id: d.id.toValue(),
      name: d.name,
      observations: d.observations,
      clinic: d.clinic,
      appliedAt: d.appliedAt,
      nextDose: d.nextDose,
      animalId: d.animalId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))
  }

  @Patch(':animalId/dewormings/:dewormingId')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('dewormingId') dewormingId: string,
    @Body() dto: UpdateDewormingDto,
  ) {
    const deworming = await this.updateDewormingUseCase.execute({
      ...dto,
      animalId,
      dewormingId,
      requesterId: req.user.id,
    })
    return {
      id: deworming.id.toValue(),
      name: deworming.name,
      observations: deworming.observations,
      clinic: deworming.clinic,
      appliedAt: deworming.appliedAt,
      nextDose: deworming.nextDose,
      animalId: deworming.animalId,
      createdAt: deworming.createdAt,
      updatedAt: deworming.updatedAt,
    }
  }

  @Delete(':animalId/dewormings/:dewormingId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('dewormingId') dewormingId: string,
  ) {
    await this.deleteDewormingUseCase.execute({
      animalId,
      dewormingId,
      requesterId: req.user.id,
    })
    return { ok: true }
  }
}
