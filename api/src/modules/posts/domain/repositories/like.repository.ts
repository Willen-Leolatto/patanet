import { Like } from '../entities/like'

export abstract class LikeRepository {
  abstract findByUserAndPost(
    userId: string,
    postId: string,
  ): Promise<Like | null>
  abstract save(like: Like): Promise<void>
  abstract delete(id: string): Promise<void>
  abstract deleteByPostId(postId: string): Promise<void>
}
