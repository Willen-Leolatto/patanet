import { Post } from '../entities/post'

export abstract class PostRepository {
  abstract findById(id: string, excludeUserIds?: string[]): Promise<Post | null>
  abstract findFeed(
    userId: string,
    followedIds: string[],
    params: { page: number; perPage: number },
    excludeUserIds?: string[],
  ): Promise<{ items: Post[]; total: number }>
  abstract findByUserId(
    userId: string,
    params: { page: number; perPage: number },
    excludeUserIds?: string[],
  ): Promise<{ items: Post[]; total: number }>
  abstract save(post: Post): Promise<void>
  abstract delete(id: string): Promise<void>
}
