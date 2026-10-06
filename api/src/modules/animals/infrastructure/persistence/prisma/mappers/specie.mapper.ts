import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Specie } from '@modules/animals/domain/entities/specie'
import { Specie as PrismaSpecie } from '@prisma/client'

export class SpecieMapper {
  static toDomain(row: PrismaSpecie): Specie {
    return Specie.reconstitute(
      {
        name: row.name,
        image: row.image,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }
}
