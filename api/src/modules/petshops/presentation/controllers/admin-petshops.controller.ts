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
import { ReviewPetshopApplicationUseCase } from '../../application/use-cases/review-petshop-application.use-case'
import { ReviewPetshopStatusDto } from '../dtos/review-petshop-status.dto'
import { ResponsePetshopDto } from '../dtos/response-petshop.dto'

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/petshops')
export class AdminPetshopsController {
  constructor(
    private readonly reviewPetshopApplicationUseCase: ReviewPetshopApplicationUseCase,
  ) {}

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: ReviewPetshopStatusDto,
  ) {
    const petshop = await this.reviewPetshopApplicationUseCase.execute({
      petshopId: id,
      status: dto.status,
    })
    return new ResponsePetshopDto(petshop)
  }
}
