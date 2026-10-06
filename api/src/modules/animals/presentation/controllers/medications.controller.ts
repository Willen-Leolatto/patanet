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
import { CreateMedicationDto } from '../dtos/create-medication.dto'
import { UpdateMedicationDto } from '../dtos/update-medication.dto'
import { CreateMedicationUseCase } from '../../application/use-cases/create-medication.use-case'
import { UpdateMedicationUseCase } from '../../application/use-cases/update-medication.use-case'
import { DeleteMedicationUseCase } from '../../application/use-cases/delete-medication.use-case'
import { GetMedicationsUseCase } from '../../application/use-cases/get-medications.use-case'

@UseGuards(AuthGuard)
@Controller('animals')
export class MedicationsController {
  constructor(
    private readonly createMedicationUseCase: CreateMedicationUseCase,
    private readonly updateMedicationUseCase: UpdateMedicationUseCase,
    private readonly deleteMedicationUseCase: DeleteMedicationUseCase,
    private readonly getMedicationsUseCase: GetMedicationsUseCase,
  ) {}

  @Post('medications/:animalId')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Body() dto: CreateMedicationDto,
  ) {
    const medication = await this.createMedicationUseCase.execute({
      ...dto,
      animalId,
      requesterId: req.user.id,
    })
    return {
      id: medication.id.toValue(),
      name: medication.name,
      startAt: medication.startAt,
      endAt: medication.endAt,
      dosage: medication.dosage,
      frequency: medication.frequency,
      clinic: medication.clinic,
      observations: medication.observations,
      animalId: medication.animalId,
      createdAt: medication.createdAt,
      updatedAt: medication.updatedAt,
    }
  }

  @Get('medications/:animalId')
  async list(@Param('animalId') animalId: string) {
    const items = await this.getMedicationsUseCase.execute({ animalId })
    return items.map(m => ({
      id: m.id.toValue(),
      name: m.name,
      startAt: m.startAt,
      endAt: m.endAt,
      dosage: m.dosage,
      frequency: m.frequency,
      clinic: m.clinic,
      observations: m.observations,
      animalId: m.animalId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }))
  }

  @Patch(':animalId/medications/:medicationId')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('medicationId') medicationId: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    const medication = await this.updateMedicationUseCase.execute({
      ...dto,
      animalId,
      medicationId,
      requesterId: req.user.id,
    })
    return {
      id: medication.id.toValue(),
      name: medication.name,
      startAt: medication.startAt,
      endAt: medication.endAt,
      dosage: medication.dosage,
      frequency: medication.frequency,
      clinic: medication.clinic,
      observations: medication.observations,
      animalId: medication.animalId,
      createdAt: medication.createdAt,
      updatedAt: medication.updatedAt,
    }
  }

  @Delete(':animalId/medications/:medicationId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('medicationId') medicationId: string,
  ) {
    await this.deleteMedicationUseCase.execute({
      animalId,
      medicationId,
      requesterId: req.user.id,
    })
    return { ok: true }
  }
}
