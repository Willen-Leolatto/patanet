export abstract class BlockRepository {
  abstract findBlockedUserIds(userId: string): Promise<string[]>
}
