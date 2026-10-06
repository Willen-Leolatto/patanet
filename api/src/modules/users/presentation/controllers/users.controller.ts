import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express'
import { StoragePort } from '@shared/application/ports/storage.port'
import { AdminGuard } from '@shared/presentation/guards/admin.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import { Public } from '@shared/presentation/decorators/public.decorator'
import { SkipTermsCheck } from '@shared/presentation/decorators/skip-terms-check.decorator'
import { EnvService } from 'src/env/env.service'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case'
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case'
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.use-case'
import { FindUsersUseCase } from '../../application/use-cases/find-users.use-case'
import { UpdatePasswordUseCase } from '../../application/use-cases/update-password.use-case'
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case'
import { LinkGoogleAccountUseCase } from '../../application/use-cases/link-google-account.use-case'
import { UnlinkGoogleAccountUseCase } from '../../application/use-cases/unlink-google-account.use-case'
import { ChangeUserRoleUseCase } from '../../application/use-cases/change-user-role.use-case'
import { AcceptTermsUseCase } from '../../application/use-cases/accept-terms.use-case'
import { CreateUserDto } from '../dtos/create-user.dto'
import { ResponseUserDto } from '../dtos/response-user.dto'
import { UpdatePasswordDto } from '../dtos/update-password.dto'
import { UpdateUserDto } from '../dtos/update-user.dto'
import { LinkGoogleAccountDto } from '../dtos/link-google-account.dto'
import { UpdateUserRoleDto } from '../dtos/update-user-role.dto'

type UpdateFiles = {
  image?: Express.Multer.File[]
  imageCover?: Express.Multer.File[]
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly storagePort: StoragePort,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUsersUseCase: FindUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly linkGoogleAccountUseCase: LinkGoogleAccountUseCase,
    private readonly unlinkGoogleAccountUseCase: UnlinkGoogleAccountUseCase,
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
    private readonly acceptTermsUseCase: AcceptTermsUseCase,
    private readonly envService: EnvService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpe?g|png|webp|gif)$/ }),
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
        fileIsRequired: false,
      }),
    )
    image: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
  ) {
    if (image) {
      const { url } = await this.storagePort.upload(image)
      createUserDto.image = url
    }
    const user = await this.createUserUseCase.execute(createUserDto)
    return new ResponseUserDto(user)
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query() requestPaginationDto: RequestPaginationDto) {
    const { page = 1, perPage = 10, query } = requestPaginationDto
    const { items, total } = await this.findUsersUseCase.execute({
      page,
      perPage,
      query,
    })
    const data = items.map(u => new ResponseUserDto(u))
    return new ResponsePaginationDto(data, {
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      total,
    })
  }

  @SkipTermsCheck()
  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(@Req() req: AuthenticatedRequest) {
    const user = await this.findUserByIdUseCase.execute({ id: req.user.id })
    return new ResponseUserDto(user)
  }

  @UseGuards(AuthGuard)
  @Post('me/google')
  @HttpCode(HttpStatus.OK)
  async linkGoogle(
    @Req() req: AuthenticatedRequest,
    @Body() linkGoogleAccountDto: LinkGoogleAccountDto,
  ) {
    await this.linkGoogleAccountUseCase.execute({
      userId: req.user.id,
      idToken: linkGoogleAccountDto.idToken,
    })
    const user = await this.findUserByIdUseCase.execute({ id: req.user.id })
    return new ResponseUserDto(user)
  }

  @UseGuards(AuthGuard)
  @Delete('me/google')
  @HttpCode(HttpStatus.OK)
  async unlinkGoogle(@Req() req: AuthenticatedRequest) {
    await this.unlinkGoogleAccountUseCase.execute({ userId: req.user.id })
    const user = await this.findUserByIdUseCase.execute({ id: req.user.id })
    return new ResponseUserDto(user)
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOneById(@Param('id') id: string) {
    const user = await this.findUserByIdUseCase.execute({ id })
    return new ResponseUserDto(user)
  }

  @UseGuards(AuthGuard)
  @Patch()
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
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const currentUser = await this.findUserByIdUseCase.execute({
      id: req.user.id,
    })

    if (files?.image?.length) {
      if (currentUser.image) await this.storagePort.delete(currentUser.image)
      const { url } = await this.storagePort.upload(files.image[0])
      updateUserDto.image = url
    }
    if (files?.imageCover?.length) {
      if (currentUser.imageCover)
        await this.storagePort.delete(currentUser.imageCover)
      const { url } = await this.storagePort.upload(files.imageCover[0])
      updateUserDto.imageCover = url
    }
    await this.updateUserUseCase.execute({ id: req.user.id, ...updateUserDto })
  }

  @UseGuards(AuthGuard)
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Req() req: AuthenticatedRequest,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.updatePasswordUseCase.execute({
      id: req.user.id,
      ...updatePasswordDto,
    })
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    const user = await this.changeUserRoleUseCase.execute({
      id,
      role: updateUserRoleDto.role,
    })
    return new ResponseUserDto(user)
  }

  @SkipTermsCheck()
  @UseGuards(AuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: AuthenticatedRequest) {
    await this.deleteUserUseCase.execute({ id: req.user.id })
  }

  @SkipTermsCheck()
  @UseGuards(AuthGuard)
  @Get('terms')
  async getTermsStatus(@Req() req: AuthenticatedRequest) {
    const currentVersion = this.envService.get('CURRENT_TERMS_VERSION')
    return {
      currentVersion,
      acceptedVersion: req.user.termsVersion,
      requiresAcceptance: req.user.termsVersion !== currentVersion,
      termsUrl: this.envService.get('TERMS_OF_SERVICE_URL'),
    }
  }

  @SkipTermsCheck()
  @UseGuards(AuthGuard)
  @Get('me/terms')
  async getMyTermsStatus(@Req() req: AuthenticatedRequest) {
    return this.getTermsStatus(req)
  }

  @SkipTermsCheck()
  @UseGuards(AuthGuard)
  @Post('terms/accept')
  @HttpCode(HttpStatus.OK)
  async acceptTerms(@Req() req: AuthenticatedRequest) {
    const user = await this.acceptTermsUseCase.execute({
      id: req.user.id,
      version: this.envService.get('CURRENT_TERMS_VERSION'),
    })
    return new ResponseUserDto(user)
  }

  @SkipTermsCheck()
  @UseGuards(AuthGuard)
  @Post('me/terms/accept')
  @HttpCode(HttpStatus.OK)
  async acceptMyTerms(@Req() req: AuthenticatedRequest) {
    return this.acceptTerms(req)
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeById(@Param('id') id: string) {
    await this.deleteUserUseCase.execute({ id })
  }
}
