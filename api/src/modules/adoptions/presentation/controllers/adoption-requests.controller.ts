import { Controller, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { RejectAdoptionRequestUseCase } from '../../application/use-cases/reject-adoption-request.use-case'
import { TransferPetCustodyUseCase } from '../../application/use-cases/transfer-pet-custody.use-case'

@UseGuards(AuthGuard)
@Controller('adoption-requests')
export class AdoptionRequestsController {
  constructor(
    private readonly transferPetCustodyUseCase: TransferPetCustodyUseCase,
    private readonly rejectAdoptionRequestUseCase: RejectAdoptionRequestUseCase,
  ) {}

  @Patch(':id/approve')
  async approve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.transferPetCustodyUseCase.execute({
      adoptionRequestId: id,
      requesterId: req.user.id,
    })
  }

  @Patch(':id/reject')
  async reject(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const request = await this.rejectAdoptionRequestUseCase.execute({
      adoptionRequestId: id,
      requesterId: req.user.id,
    })
    return {
      id: request.id.toValue(),
      animalId: request.animalId,
      requesterUserId: request.requesterUserId,
      petshopId: request.petshopId,
      status: request.status,
      message: request.message,
      updatedAt: request.updatedAt,
    }
  }
}
