import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { StoragePort } from '@shared/application/ports/storage.port'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { BreedsQueryDto } from '../dtos/breeds-query.dto'
import { AddAnimalMediaUseCase } from '../../application/use-cases/add-animal-media.use-case'
import { DeleteAnimalMediaUseCase } from '../../application/use-cases/delete-animal-media.use-case'
import { GetAnimalMediasUseCase } from '../../application/use-cases/get-animal-medias.use-case'

@UseGuards(AuthGuard)
@Controller('animals')
export class AnimalMediasController {
  constructor(
    private readonly storagePort: StoragePort,
    private readonly addAnimalMediaUseCase: AddAnimalMediaUseCase,
    private readonly deleteAnimalMediaUseCase: DeleteAnimalMediaUseCase,
    private readonly getAnimalMediasUseCase: GetAnimalMediasUseCase,
  ) {}

  @Post('medias/:animalId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('media'))
  async addMedia(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @UploadedFile() media: Express.Multer.File,
    @Body() body: { text?: string },
  ) {
    const { url: imageUrl } = await this.storagePort.upload(media)
    await this.addAnimalMediaUseCase.execute({
      animalId,
      requesterId: req.user.id,
      imageUrl,
      text: body.text,
    })
  }

  @Delete(':animalId/medias/:mediaId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('media'))
  async removeMedia(
    @Req() req: AuthenticatedRequest,
    @Param('animalId') animalId: string,
    @Param('mediaId') mediaId: string,
  ) {
    await this.deleteAnimalMediaUseCase.execute({
      animalId,
      mediaId,
      requesterId: req.user.id,
    })
  }

  @Get('medias/:animalId')
  async list(
    @Param('animalId') animalId: string,
    @Query() query: BreedsQueryDto,
  ) {
    const { page = 1, perPage = 10 } = query
    const { items, total } = await this.getAnimalMediasUseCase.execute({
      animalId,
      page,
      perPage,
    })
    return new ResponsePaginationDto(
      items.map(m => ({
        id: m.id.toValue(),
        text: m.text,
        path: m.path,
        type: m.type,
        animalId: m.animalId,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      { page, perPage, pages: Math.ceil(total / perPage), total },
    )
  }
}
