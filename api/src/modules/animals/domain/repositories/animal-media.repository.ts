import { AnimalMedia } from '../entities/animal-media'

export abstract class AnimalMediaRepository {
  abstract findById(id: string): Promise<AnimalMedia | null>
  abstract findByAnimal(
    animalId: string,
    params: { page: number; perPage: number },
  ): Promise<{ items: AnimalMedia[]; total: number }>
  abstract countByAnimal(animalId: string): Promise<number>
  abstract save(media: AnimalMedia): Promise<void>
  abstract delete(id: string): Promise<void>
}
