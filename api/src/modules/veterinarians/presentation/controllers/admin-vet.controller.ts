import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '@shared/presentation/guards/admin.guard'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import { ReviewVeterinarianApplicationUseCase } from '../../application/use-cases/review-veterinarian-application.use-case'
import { ReviewVeterinarianStatusDto } from '../dtos/review-veterinarian-status.dto'
import { ResponseVeterinarianProfileDto } from '../dtos/response-veterinarian-profile.dto'

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/vet')
export class AdminVetController {
  constructor(
    private readonly reviewVeterinarianApplicationUseCase: ReviewVeterinarianApplicationUseCase,
  ) {}

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: ReviewVeterinarianStatusDto,
  ) {
    const profile = await this.reviewVeterinarianApplicationUseCase.execute({
      profileId: id,
      status: dto.status,
    })
    return new ResponseVeterinarianProfileDto(profile)
  }
}
