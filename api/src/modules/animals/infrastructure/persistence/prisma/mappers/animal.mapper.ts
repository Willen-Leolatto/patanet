import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { Animal } from '@modules/animals/domain/entities/animal'
import { OwnerIdList } from '@modules/animals/domain/watched-list/owner-id-list'
import {
  Animal as PrismaAnimal,
  Breed as PrismaBreed,
  Specie as PrismaSpecie,
  User as PrismaUser,
} from '@prisma/client'

type OwnerSummary = Pick<
  PrismaUser,
  'id' | 'name' | 'username' | 'email' | 'image' | 'imageCover'
>

type AnimalRow = PrismaAnimal & {
  breed?: (PrismaBreed & { specie?: PrismaSpecie | null }) | null
  owners?: OwnerSummary[]
}

export class AnimalMapper {
  static toDomain(row: AnimalRow): Animal {
    const ownerIds = new OwnerIdList(row.owners ? row.owners.map(o => o.id) : [])

    const breed = row.breed
      ? {
          id: row.breed.id,
          name: row.breed.name,
          image: row.breed.image,
          specie: row.breed.specie
            ? {
                id: row.breed.specie.id,
                name: row.breed.specie.name,
                image: row.breed.specie.image,
              }
            : undefined,
        }
      : undefined

    const owners = row.owners
      ? row.owners.map(o => ({
          id: o.id,
          name: o.name,
          username: o.username,
          email: o.email,
          image: o.image,
          imageCover: o.imageCover,
        }))
      : undefined

    return Animal.reconstitute(
      {
        name: row.name,
        about: row.about,
        image: row.image,
        imageCover: row.imageCover,
        weight: row.weight,
        size: row.size,
        gender: row.gender,
        birthDate: row.birthDate,
        adoptionDate: row.adoptionDate,
        breedId: row.breedId,
        ownerId: row.ownerId,
        createdByOwnerId: row.createdByOwnerId,
        ownerIds,
        adoptionEventId: row.adoptionEventId,
        isForAdoption: row.isForAdoption,
        petshopId: row.petshopId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        breed,
        owners,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: Animal) {
    return {
      id: domain.id.toValue(),
      name: domain.name,
      about: domain.about,
      image: domain.image,
      imageCover: domain.imageCover,
      weight: domain.weight,
      size: domain.size as PrismaAnimal['size'],
      gender: domain.gender as PrismaAnimal['gender'],
      birthDate: domain.birthDate,
      adoptionDate: domain.adoptionDate,
      breedId: domain.breedId,
      ownerId: domain.ownerId,
      createdByOwnerId: domain.createdByOwnerId,
      adoptionEventId: domain.adoptionEventId,
      isForAdoption: domain.isForAdoption,
      petshopId: domain.petshopId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
