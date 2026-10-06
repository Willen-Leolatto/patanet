import { User } from '@modules/users/domain/entities/user'
import { Connection } from '../entities/connection'

export abstract class ConnectionRepository {
  abstract findByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<Connection | null>
  abstract findFollowers(
    userId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: User[]; total: number }>
  abstract findFollowing(
    userId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: User[]; total: number }>
  abstract countFollowers(userId: string): Promise<number>
  abstract countFollowing(userId: string): Promise<number>
  abstract save(connection: Connection): Promise<void>
  abstract delete(id: string): Promise<void>
}
