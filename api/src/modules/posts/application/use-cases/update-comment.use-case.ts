import { Injectable, NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { CommentRepository } from '../../domain/repositories/comment.repository'
import { Comment } from '../../domain/entities/comment'

export interface UpdateCommentInput {
  requesterId: string
  postId: string
  commentId: string
  message: string
}

@Injectable()
export class UpdateCommentUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  async execute(input: UpdateCommentInput): Promise<Comment> {
    const post = await this.postRepository.findById(input.postId)
    if (!post) throw new NotFoundException('Post not found')

    const comment = await this.commentRepository.findById(input.commentId)
    if (
      !comment ||
      comment.postId !== input.postId ||
      comment.userId !== input.requesterId
    ) {
      throw new NotFoundException('Comment not found')
    }

    comment.update(input.message)
    await this.commentRepository.save(comment)
    return comment
  }
}
