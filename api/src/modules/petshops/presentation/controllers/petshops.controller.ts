import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { StoragePort } from '@shared/application/ports/storage.port'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { ApplyPetshopUseCase } from '../../application/use-cases/apply-petshop.use-case'
import { ApplyPetshopDto } from '../dtos/apply-petshop.dto'
import { ResponsePetshopDto } from '../dtos/response-petshop.dto'

@UseGuards(AuthGuard)
@Controller('petshops')
export class PetshopsController {
  constructor(
    private readonly storagePort: StoragePort,
    private readonly applyPetshopUseCase: ApplyPetshopUseCase,
  ) {}

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('alvara'))
  async apply(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() alvara: Express.Multer.File,
    @Body() dto: ApplyPetshopDto,
  ) {
    let alvaraUrl: string | null = null
    if (alvara) {
      const { url } = await this.storagePort.upload(alvara)
      alvaraUrl = url
    }

    const petshop = await this.applyPetshopUseCase.execute({
      ownerUserId: req.user.id,
      cnpj: dto.cnpj,
      businessName: dto.businessName,
      alvaraUrl,
      responsavelTecnicoNome: dto.responsavelTecnicoNome ?? null,
      addressLine: dto.addressLine,
      addressCity: dto.addressCity,
      addressState: dto.addressState,
    })
    return new ResponsePetshopDto(petshop)
  }
}
