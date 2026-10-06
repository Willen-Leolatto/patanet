export abstract class AnimalVisibilityRepository {
  abstract findHiddenIdsByUser(userId: string): Promise<string[]>
  abstract upsert(
    animalId: string,
    userId: string,
    hidden: boolean,
  ): Promise<void>
  abstract deleteByUser(userId: string): Promise<void>
}
