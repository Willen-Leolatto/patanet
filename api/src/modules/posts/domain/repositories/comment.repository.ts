import { Comment } from '../entities/comment'

export abstract class CommentRepository {
  abstract findById(id: string): Promise<Comment | null>
  abstract save(comment: Comment): Promise<void>
  abstract delete(id: string): Promise<void>
  abstract deleteByPostId(postId: string): Promise<void>
}
