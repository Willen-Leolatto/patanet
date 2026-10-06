import {
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
} from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { GetAnimalsByOwnerUseCase } from '../../application/use-cases/get-animals-by-owner.use-case'
import { AddTutorUseCase } from '../../application/use-cases/add-tutor.use-case'
import { RemoveTutorUseCase } from '../../application/use-cases/remove-tutor.use-case'
import { TransferPrimaryTutorUseCase } from '../../application/use-cases/transfer-primary-tutor.use-case'

@UseGuards(AuthGuard)
@Controller('animals')
export class OwnersController {
  constructor(
    private readonly getAnimalsByOwnerUseCase: GetAnimalsByOwnerUseCase,
    private readonly addTutorUseCase: AddTutorUseCase,
    private readonly removeTutorUseCase: RemoveTutorUseCase,
    private readonly transferPrimaryTutorUseCase: TransferPrimaryTutorUseCase,
  ) {}

  @Get('owners/:id')
  async findByOwner(
    @Param('id') id: string,
    @Query() pagination: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10, query } = pagination
    const { items, total } = await this.getAnimalsByOwnerUseCase.execute({
      ownerId: id,
      query,
      page,
      perPage,
    })
    const data = items.map(a => ({
      id: a.id.toValue(),
      name: a.name,
      about: a.about,
      image: a.image,
      imageCover: a.imageCover,
      weight: a.weight,
      size: a.size,
      gender: a.gender,
      birthDate: a.birthDate,
      adoptionDate: a.adoptionDate,
      ownerId: a.ownerId,
      createdByOwnerId: a.createdByOwnerId,
      breedId: a.breedId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      breed: a.breed,
      owners: a.owners,
      mediasCount: a.mediasCount,
    }))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Post(':animalId/owners/:ownerId')
  @HttpCode(HttpStatus.OK)
  async addOwner(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('ownerId') ownerId: string,
  ) {
    await this.addTutorUseCase.execute({
      animalId,
      newOwnerId: ownerId,
      requesterId: req.user.id,
    })
  }

  @Post(':animalId/owner/:ownerId')
  @HttpCode(HttpStatus.OK)
  async addOwnerAlias(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('ownerId') ownerId: string,
  ) {
    await this.addTutorUseCase.execute({
      animalId,
      newOwnerId: ownerId,
      requesterId: req.user.id,
    })
  }

  @Delete(':animalId/owners/:ownerId')
  @HttpCode(HttpStatus.OK)
  async removeOwner(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('ownerId') ownerId: string,
  ) {
    await this.removeTutorUseCase.execute({
      animalId,
      ownerId,
      requesterId: req.user.id,
    })
  }

  @Delete(':animalId/owner/:ownerId')
  @HttpCode(HttpStatus.OK)
  async removeOwnerAlias(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('ownerId') ownerId: string,
  ) {
    await this.removeTutorUseCase.execute({
      animalId,
      ownerId,
      requesterId: req.user.id,
    })
  }

  @Patch(':animalId/owners/:ownerId/primary')
  @HttpCode(HttpStatus.OK)
  async transferPrimary(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('ownerId') ownerId: string,
  ) {
    await this.transferPrimaryTutorUseCase.execute({
      animalId,
      newPrimaryId: ownerId,
      requesterId: req.user.id,
    })
  }

  @Patch(':animalId/owner/:ownerId/primary')
  @HttpCode(HttpStatus.OK)
  async transferPrimaryAlias(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('ownerId') ownerId: string,
  ) {
    await this.transferPrimaryTutorUseCase.execute({
      animalId,
      newPrimaryId: ownerId,
      requesterId: req.user.id,
    })
  }
}
