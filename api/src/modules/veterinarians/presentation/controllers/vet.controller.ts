import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { StoragePort } from '@shared/application/ports/storage.port'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { ApplyVeterinarianUseCase } from '../../application/use-cases/apply-veterinarian.use-case'
import { ApplyVeterinarianDto } from '../dtos/apply-veterinarian.dto'
import { ResponseVeterinarianProfileDto } from '../dtos/response-veterinarian-profile.dto'

@UseGuards(AuthGuard)
@Controller('vet')
export class VetController {
  constructor(
    private readonly storagePort: StoragePort,
    private readonly applyVeterinarianUseCase: ApplyVeterinarianUseCase,
  ) {}

  @Post('apply')
  @UseInterceptors(FilesInterceptor('documents', 5))
  async apply(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() documents: Express.Multer.File[],
    @Body() dto: ApplyVeterinarianDto,
  ) {
    const documentUrls = await Promise.all(
      (documents ?? []).map(async file => {
        const { url } = await this.storagePort.upload(file)
        return url
      }),
    )

    const profile = await this.applyVeterinarianUseCase.execute({
      userId: req.user.id,
      crmv: dto.crmv,
      uf: dto.uf,
      documentUrls,
    })
    return new ResponseVeterinarianProfileDto(profile)
  }
}
