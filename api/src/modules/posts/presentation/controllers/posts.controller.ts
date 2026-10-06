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
import { CreatePostUseCase } from '../../application/use-cases/create-post.use-case'
import { UpdatePostUseCase } from '../../application/use-cases/update-post.use-case'
import { DeletePostUseCase } from '../../application/use-cases/delete-post.use-case'
import { GetFeedUseCase } from '../../application/use-cases/get-feed.use-case'
import { GetPostsByUserUseCase } from '../../application/use-cases/get-posts-by-user.use-case'
import { GetPostByIdUseCase } from '../../application/use-cases/get-post-by-id.use-case'
import { ToggleLikeUseCase } from '../../application/use-cases/toggle-like.use-case'
import { CreatePostDto } from '../dtos/create-post.dto'
import { UpdatePostDto } from '../dtos/update-post.dto'
import { ResponsePostDto } from '../dtos/response-post.dto'
import { RequestPaginationDto } from '../../../../shared/presentation/dto/request-pagination.dto'
import { ResponsePaginationDto } from '../../../../shared/presentation/dto/response-pagination.dto'
type PostUploadedFiles = {
  medias?: Express.Multer.File[]
}

function mediaTypeFromMimetype(mimetype: string | undefined): 'IMAGE' | 'VIDEO' {
  return mimetype?.startsWith('video/') ? 'VIDEO' : 'IMAGE'
}

@UseGuards(AuthGuard)
@Controller('posts')
export class PostsController {
  constructor(
    private readonly storagePort: StoragePort,
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly getFeedUseCase: GetFeedUseCase,
    private readonly getPostsByUserUseCase: GetPostsByUserUseCase,
    private readonly getPostByIdUseCase: GetPostByIdUseCase,
    private readonly toggleLikeUseCase: ToggleLikeUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'medias', maxCount: 5 }]))
  async create(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files: PostUploadedFiles,
    @Body() dto: CreatePostDto,
  ) {
    const medias: { path: string; type: 'IMAGE' | 'VIDEO' }[] = []
    for (const file of files?.medias ?? []) {
      const { url } = await this.storagePort.upload(file)
      medias.push({ path: url, type: mediaTypeFromMimetype(file.mimetype) })
    }
    const post = await this.createPostUseCase.execute({
      authorId: req.user.id,
      subtitle: dto.subtitle,
      petIds: dto.pets,
      medias,
    })
    return new ResponsePostDto(post)
  }

  @Patch(':postId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'medias', maxCount: 5 }]))
  async update(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files: PostUploadedFiles,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    const medias: { path: string; type: 'IMAGE' | 'VIDEO' }[] = []
    for (const file of files?.medias ?? []) {
      const { url } = await this.storagePort.upload(file)
      medias.push({ path: url, type: mediaTypeFromMimetype(file.mimetype) })
    }
    await this.updatePostUseCase.execute({
      requesterId: req.user.id,
      postId,
      subtitle: dto.subtitle,
      petIds: dto.pets,
      medias: medias.length > 0 ? medias : undefined,
    })
  }

  @Get('me')
  async myPosts(
    @Req() req: AuthenticatedRequest,
    @Query() query: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = query
    const { items, total } = await this.getPostsByUserUseCase.execute({
      userId: req.user.id,
      requesterId: req.user.id,
      page,
      perPage,
    })
    return new ResponsePaginationDto(
      items.map(p => new ResponsePostDto(p)),
      { page, perPage, pages: Math.ceil(total / perPage), total },
    )
  }

  @Get('user/:id')
  async userPosts(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query() query: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = query
    const { items, total } = await this.getPostsByUserUseCase.execute({
      userId: id,
      requesterId: req.user.id,
      page,
      perPage,
    })
    return new ResponsePaginationDto(
      items.map(p => new ResponsePostDto(p)),
      { page, perPage, pages: Math.ceil(total / perPage), total },
    )
  }

  @Get('feed')
  async myFeed(
    @Req() req: AuthenticatedRequest,
    @Query() query: RequestPaginationDto,
  ) {
    const { page = 1, perPage = 10 } = query
    const { items, total } = await this.getFeedUseCase.execute({
      userId: req.user.id,
      page,
      perPage,
    })
    return new ResponsePaginationDto(
      items.map(p => new ResponsePostDto(p)),
      { page, perPage, pages: Math.ceil(total / perPage), total },
    )
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const post = await this.getPostByIdUseCase.execute({
      postId: id,
      requesterId: req.user.id,
    })
    return new ResponsePostDto(post)
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.deletePostUseCase.execute({
      requesterId: req.user.id,
      postId: id,
    })
  }

  @Post('like/:id')
  @HttpCode(HttpStatus.CREATED)
  async addLike(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.toggleLikeUseCase.execute({
      userId: req.user.id,
      postId: id,
      action: 'like',
    })
  }

  @Delete('like/:id')
  @HttpCode(HttpStatus.OK)
  async removeLike(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.toggleLikeUseCase.execute({
      userId: req.user.id,
      postId: id,
      action: 'unlike',
    })
  }
}
