import { Animal } from '../entities/animal'

export abstract class AnimalRepository {
  abstract findById(id: string): Promise<Animal | null>
  abstract findManyByIds(ids: string[]): Promise<Animal[]>
  abstract findByOwner(
    ownerId: string,
    params: { query?: string; page: number; perPage: number },
  ): Promise<{ items: Animal[]; total: number }>
  abstract findAllTutoredBy(userId: string): Promise<Animal[]>
  // Pets sem dono (owner_id IS NULL), disponiveis para adocao -- opcionalmente
  // filtrados por evento de adocao de uma instituicao.
  abstract findAdoptable(params: {
    eventId?: string
    page: number
    perPage: number
  }): Promise<{ items: Animal[]; total: number }>
  abstract save(animal: Animal): Promise<void>
  abstract delete(id: string): Promise<void>
}
