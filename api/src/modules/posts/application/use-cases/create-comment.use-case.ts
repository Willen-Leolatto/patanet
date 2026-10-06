import { Injectable, NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { CommentRepository } from '../../domain/repositories/comment.repository'
import { Comment } from '../../domain/entities/comment'

export interface CreateCommentInput {
  userId: string
  postId: string
  message: string
  parentId?: string
}

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    const post = await this.postRepository.findById(input.postId)
    if (!post) throw new NotFoundException('Post not found')

    if (input.parentId) {
      const parent = await this.commentRepository.findById(input.parentId)
      if (!parent || parent.postId !== input.postId) {
        throw new NotFoundException('Parent comment not found')
      }
    }

    const comment = Comment.create({
      userId: input.userId,
      postId: input.postId,
      message: input.message,
      parentId: input.parentId ?? null,
    })

    await this.commentRepository.save(comment)
    return comment
  }
}
