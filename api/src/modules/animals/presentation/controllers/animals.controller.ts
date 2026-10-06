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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { StoragePort } from '@shared/application/ports/storage.port'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { CreateAnimalUseCase } from '../../application/use-cases/create-animal.use-case'
import { UpdateAnimalUseCase } from '../../application/use-cases/update-animal.use-case'
import { DeleteAnimalUseCase } from '../../application/use-cases/delete-animal.use-case'
import { GetAnimalByIdUseCase } from '../../application/use-cases/get-animal-by-id.use-case'
import { AdoptAnimalUseCase } from '../../application/use-cases/adopt-animal.use-case'
import { ListAdoptableAnimalsUseCase } from '../../application/use-cases/list-adoptable-animals.use-case'
import { CreateAnimalDto } from '../dtos/create-animal.dto'
import { UpdateAnimalDto } from '../dtos/update-animal.dto'

type UpdateFiles = {
  image?: Express.Multer.File[]
  imageCover?: Express.Multer.File[]
}

@UseGuards(AuthGuard)
@Controller('animals')
export class AnimalsController {
  constructor(
    private readonly storagePort: StoragePort,
    private readonly createAnimalUseCase: CreateAnimalUseCase,
    private readonly updateAnimalUseCase: UpdateAnimalUseCase,
    private readonly deleteAnimalUseCase: DeleteAnimalUseCase,
    private readonly getAnimalByIdUseCase: GetAnimalByIdUseCase,
    private readonly adoptAnimalUseCase: AdoptAnimalUseCase,
    private readonly listAdoptableAnimalsUseCase: ListAdoptableAnimalsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'imageCover', maxCount: 1 },
    ]),
  )
  async create(
    @UploadedFiles() files: UpdateFiles,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAnimalDto,
  ) {
    if (files?.image?.length) {
      const { url } = await this.storagePort.upload(files.image[0])
      dto.image = url
    }
    if (files?.imageCover?.length) {
      const { url } = await this.storagePort.upload(files.imageCover[0])
      dto.imageCover = url
    }
    const animal = await this.createAnimalUseCase.execute({
      ...dto,
      requesterId: req.user.id,
    })
    return {
      id: animal.id.toValue(),
      name: animal.name,
      about: animal.about,
      image: animal.image,
      imageCover: animal.imageCover,
      weight: animal.weight,
      size: animal.size,
      gender: animal.gender,
      birthDate: animal.birthDate,
      adoptionDate: animal.adoptionDate,
      ownerId: animal.ownerId,
      createdByOwnerId: animal.createdByOwnerId,
      adoptionEventId: animal.adoptionEventId,
      isForAdoption: animal.isForAdoption,
      petshopId: animal.petshopId,
      breedId: animal.breedId,
      createdAt: animal.createdAt,
      updatedAt: animal.updatedAt,
      breed: animal.breed,
      owners: animal.owners,
    }
  }

  // Precisa vir antes de ':id' -- caso contrario 'adoptable' seria
  // interpretado como um id de animal.
  @Get('adoptable')
  async listAdoptable(
    @Query() pagination: RequestPaginationDto,
    @Query('eventId') eventId?: string,
  ) {
    const { page = 1, perPage = 10 } = pagination
    const { items, total } = await this.listAdoptableAnimalsUseCase.execute({
      eventId,
      page,
      perPage,
    })
    const data = items.map(animal => ({
      id: animal.id.toValue(),
      name: animal.name,
      about: animal.about,
      image: animal.image,
      imageCover: animal.imageCover,
      weight: animal.weight,
      size: animal.size,
      gender: animal.gender,
      birthDate: animal.birthDate,
      adoptionDate: animal.adoptionDate,
      breedId: animal.breedId,
      adoptionEventId: animal.adoptionEventId,
      createdAt: animal.createdAt,
      updatedAt: animal.updatedAt,
      breed: animal.breed,
    }))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const animal = await this.getAnimalByIdUseCase.execute({ id })
    return {
      id: animal.id.toValue(),
      name: animal.name,
      about: animal.about,
      image: animal.image,
      imageCover: animal.imageCover,
      weight: animal.weight,
      size: animal.size,
      gender: animal.gender,
      birthDate: animal.birthDate,
      adoptionDate: animal.adoptionDate,
      ownerId: animal.ownerId,
      createdByOwnerId: animal.createdByOwnerId,
      adoptionEventId: animal.adoptionEventId,
      breedId: animal.breedId,
      createdAt: animal.createdAt,
      updatedAt: animal.updatedAt,
      breed: animal.breed,
      owners: animal.owners,
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'imageCover', maxCount: 1 },
    ]),
  )
  async update(
    @UploadedFiles() files: UpdateFiles,
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
  ) {
    if (files?.image?.length) {
      const { url } = await this.storagePort.upload(files.image[0])
      dto.image = url
    }
    if (files?.imageCover?.length) {
      const { url } = await this.storagePort.upload(files.imageCover[0])
      dto.imageCover = url
    }
    await this.updateAnimalUseCase.execute({
      id,
      requesterId: req.user.id,
      ...dto,
    })
  }

  @Post(':id/adopt')
  @HttpCode(HttpStatus.OK)
  async adopt(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.adoptAnimalUseCase.execute({
      animalId: id,
      requesterId: req.user.id,
    })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.deleteAnimalUseCase.execute({ id, requesterId: req.user.id })
  }
}
