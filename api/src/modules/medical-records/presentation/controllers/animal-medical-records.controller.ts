import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { CreateMedicalRecordUseCase } from '../../application/use-cases/create-medical-record.use-case'
import { CreateMedicalRecordDto } from '../dtos/create-medical-record.dto'

// Mesmo padrao de AnimalVetController: rota sob /animals, definida no
// modulo medical-records pra evitar dependencia circular com AnimalsModule.
@UseGuards(AuthGuard)
@Controller('animals')
export class AnimalMedicalRecordsController {
  constructor(
    private readonly createMedicalRecordUseCase: CreateMedicalRecordUseCase,
  ) {}

  @Post(':id/medical-records')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateMedicalRecordDto,
  ) {
    const record = await this.createMedicalRecordUseCase.execute({
      animalId: id,
      veterinarianId: req.user.id,
      notes: dto.notes,
      examRequestUrls: dto.examRequestUrls ?? null,
      vaccines: dto.vaccines,
    })
    return {
      id: record.id.toValue(),
      animalId: record.animalId,
      veterinarianId: record.veterinarianId,
      notes: record.notes,
      examRequestUrls: record.examRequestUrls,
      signedAt: record.signedAt,
      createdAt: record.createdAt,
    }
  }
}
