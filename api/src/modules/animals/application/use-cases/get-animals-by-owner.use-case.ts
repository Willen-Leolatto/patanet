import { Injectable } from '@nestjs/common'
import { Animal } from '../../domain/entities/animal'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { AnimalMediaRepository } from '../../domain/repositories/animal-media.repository'
import { AnimalVisibilityRepository } from '../../domain/repositories/animal-visibility.repository'

export interface GetAnimalsByOwnerInput {
  ownerId: string
  query?: string
  page: number
  perPage: number
}

export interface GetAnimalsByOwnerOutput {
  items: Animal[]
  total: number
}

@Injectable()
export class GetAnimalsByOwnerUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly animalMediaRepository: AnimalMediaRepository,
    private readonly animalVisibilityRepository: AnimalVisibilityRepository,
  ) {}

  async execute(
    input: GetAnimalsByOwnerInput,
  ): Promise<GetAnimalsByOwnerOutput> {
    const { ownerId, query, page, perPage } = input

    const { items, total } = await this.animalRepository.findByOwner(ownerId, {
      query,
      page,
      perPage,
    })

    const hiddenIds = new Set(
      await this.animalVisibilityRepository.findHiddenIdsByUser(ownerId),
    )

    const visibleItems = items.filter(a => !hiddenIds.has(a.id.toValue()))

    await Promise.all(
      visibleItems.map(async animal => {
        const count = await this.animalMediaRepository.countByAnimal(
          animal.id.toValue(),
        )
        animal.setMediasCount(count)
      }),
    )

    return { items: visibleItems, total }
  }
}
