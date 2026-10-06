import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@shared/presentation/guards/auth.guard'
import type { AuthenticatedRequest } from '@shared/presentation/types/authenticated-request'
import { CreateCommentUseCase } from '../../application/use-cases/create-comment.use-case'
import { UpdateCommentUseCase } from '../../application/use-cases/update-comment.use-case'
import { DeleteCommentUseCase } from '../../application/use-cases/delete-comment.use-case'

@UseGuards(AuthGuard)
@Controller('posts')
export class CommentsController {
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
  ) {}

  @Post('comment/:id')
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('message') message?: string,
    @Body('content') content?: string,
    @Body('parentId') parentId?: string,
  ) {
    const text = message || content || ''
    const comment = await this.createCommentUseCase.execute({
      userId: req.user.id,
      postId: id,
      message: text,
      parentId,
    })
    return {
      id: comment.id.toValue(),
      message: comment.message,
      userId: comment.userId,
      postId: comment.postId,
      parentId: comment.parentId,
      user: comment.user ?? null,
      replies: comment.replies ?? [],
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }
  }

  @Patch(':postId/comment/:commentId')
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @Req() req: AuthenticatedRequest,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body('message') message?: string,
    @Body('content') content?: string,
  ) {
    const text = message || content || ''
    const comment = await this.updateCommentUseCase.execute({
      requesterId: req.user.id,
      postId,
      commentId,
      message: text,
    })
    return {
      id: comment.id.toValue(),
      message: comment.message,
      userId: comment.userId,
      postId: comment.postId,
      parentId: comment.parentId,
      user: comment.user ?? null,
      replies: comment.replies ?? [],
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }
  }

  @Delete(':postId/comment/:commentId')
  @HttpCode(HttpStatus.OK)
  async removeComment(
    @Req() req: AuthenticatedRequest,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    await this.deleteCommentUseCase.execute({
      requesterId: req.user.id,
      postId,
      commentId,
    })
    return { ok: true }
  }
}
