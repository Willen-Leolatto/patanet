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
import { AuthorizeVeterinarianUseCase } from '../../application/use-cases/authorize-veterinarian.use-case'
import { AuthorizeVeterinarianDto } from '../dtos/authorize-veterinarian.dto'

// Rota fica sob /animals (mesmo padrao de AnimalMediasController,
// VaccinesController etc. -- varios controllers de sub-recursos
// compartilham o prefixo), so que definida no modulo veterinarians pra
// evitar dependencia circular entre AnimalsModule e VeterinariansModule.
@UseGuards(AuthGuard)
@Controller('animals')
export class AnimalVetController {
  constructor(
    private readonly authorizeVeterinarianUseCase: AuthorizeVeterinarianUseCase,
  ) {}

  @Post(':id/authorize-vet')
  @HttpCode(HttpStatus.OK)
  async authorizeVet(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AuthorizeVeterinarianDto,
  ) {
    const authorization = await this.authorizeVeterinarianUseCase.execute({
      animalId: id,
      requesterId: req.user.id,
      veterinarianId: dto.veterinarianId,
    })
    return {
      id: authorization.id.toValue(),
      animalId: authorization.animalId,
      veterinarianId: authorization.veterinarianId,
      createdAt: authorization.createdAt,
    }
  }
}
