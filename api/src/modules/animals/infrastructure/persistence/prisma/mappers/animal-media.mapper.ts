import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { AnimalMedia, MediaType } from '@modules/animals/domain/entities/animal-media'
import { AnimalMedia as PrismaAnimalMedia } from '@prisma/client'

export class AnimalMediaMapper {
  static toDomain(row: PrismaAnimalMedia): AnimalMedia {
    return AnimalMedia.reconstitute(
      {
        text: row.text,
        path: row.path,
        type: row.type as unknown as MediaType,
        animalId: row.animalId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: AnimalMedia) {
    return {
      id: domain.id.toValue(),
      text: domain.text,
      path: domain.path,
      type: domain.type as unknown as PrismaAnimalMedia['type'],
      animalId: domain.animalId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
