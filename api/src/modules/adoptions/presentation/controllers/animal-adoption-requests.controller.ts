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
import { CreateAdoptionRequestUseCase } from '../../application/use-cases/create-adoption-request.use-case'
import { CreateAdoptionRequestDto } from '../dtos/create-adoption-request.dto'

// Rota sob /animals, definida no modulo adoptions (mesmo padrao de
// AnimalVetController) pra evitar dependencia circular com AnimalsModule.
@UseGuards(AuthGuard)
@Controller('animals')
export class AnimalAdoptionRequestsController {
  constructor(
    private readonly createAdoptionRequestUseCase: CreateAdoptionRequestUseCase,
  ) {}

  @Post([':id/adoption-requests', ':id/adoption-applications'])
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateAdoptionRequestDto,
  ) {
    const request = await this.createAdoptionRequestUseCase.execute({
      animalId: id,
      requesterUserId: req.user.id,
      message: dto.message,
    })
    return {
      id: request.id.toValue(),
      animalId: request.animalId,
      requesterUserId: request.requesterUserId,
      petshopId: request.petshopId,
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
    }
  }
}
