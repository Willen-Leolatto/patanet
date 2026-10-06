import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Breed } from '@modules/animals/domain/entities/breed'
import { Breed as PrismaBreed, Specie as PrismaSpecie } from '@prisma/client'

export class BreedMapper {
  static toDomain(
    row: PrismaBreed & { specie?: PrismaSpecie | null },
  ): Breed {
    return Breed.reconstitute(
      {
        name: row.name,
        about: row.about,
        appearance: row.appearance,
        temperament: row.temperament,
        trainability: row.trainability,
        exercise: row.exercise,
        coat: row.coat,
        health: row.health,
        suggestedSize: row.suggestedSize,
        typicalWeight: row.typicalWeight,
        typicalHeight: row.typicalHeight,
        lifeExpectancy: row.lifeExpectancy,
        image: row.image,
        specieId: row.specieId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        specie: row.specie
          ? {
              id: row.specie.id,
              name: row.specie.name,
              image: row.specie.image,
            }
          : undefined,
      },
      new UniqueEntityID(row.id),
    )
  }
}
