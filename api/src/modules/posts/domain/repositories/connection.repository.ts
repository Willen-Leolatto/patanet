export abstract class ConnectionRepository {
  abstract findFollowedIdsByUserId(userId: string): Promise<string[]>
}
