import { Injectable, NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { CommentRepository } from '../../domain/repositories/comment.repository'

export interface DeleteCommentInput {
  requesterId: string
  postId: string
  commentId: string
}

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  async execute(input: DeleteCommentInput): Promise<void> {
    const post = await this.postRepository.findById(input.postId)
    if (!post) throw new NotFoundException('Post not found')

    const comment = await this.commentRepository.findById(input.commentId)
    if (
      !comment ||
      comment.postId !== input.postId ||
      comment.userId !== input.requesterId
    ) {
      return
    }

    await this.commentRepository.delete(input.commentId)
  }
}
