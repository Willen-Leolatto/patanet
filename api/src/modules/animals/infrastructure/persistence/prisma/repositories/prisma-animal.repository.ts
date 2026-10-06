import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { Animal } from '@modules/animals/domain/entities/animal'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { AnimalMapper } from '../mappers/animal.mapper'

const OWNER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  image: true,
  imageCover: true,
} as const

@Injectable()
export class PrismaAnimalRepository implements AnimalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Animal | null> {
    const row = await this.prisma.animal.findUnique({
      where: { id },
      include: {
        breed: { include: { specie: true } },
        owners: { select: OWNER_SELECT },
      },
    })
    return row ? AnimalMapper.toDomain(row) : null
  }

  async findManyByIds(ids: string[]): Promise<Animal[]> {
    if (ids.length === 0) return []
    const rows = await this.prisma.animal.findMany({
      where: { id: { in: ids } },
      include: {
        breed: { include: { specie: true } },
        owners: { select: OWNER_SELECT },
      },
    })
    return rows.map(row => AnimalMapper.toDomain(row))
  }

  async findByOwner(
    ownerId: string,
    params: { query?: string; page: number; perPage: number },
  ): Promise<{ items: Animal[]; total: number }> {
    const { query, page, perPage } = params

    const where = {
      owners: { some: { id: ownerId } },
      ...(query ? { name: { contains: query, mode: 'insensitive' as const } } : {}),
    }

    const [rows, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        take: perPage,
        skip: (page - 1) * perPage,
        include: {
          breed: { include: { specie: true } },
          owners: { select: OWNER_SELECT },
        },
      }),
      this.prisma.animal.count({ where }),
    ])

    return { items: rows.map(row => AnimalMapper.toDomain(row)), total }
  }

  async findAllTutoredBy(userId: string): Promise<Animal[]> {
    const rows = await this.prisma.animal.findMany({
      where: { owners: { some: { id: userId } } },
      include: {
        breed: { include: { specie: true } },
        owners: { select: OWNER_SELECT },
      },
    })
    return rows.map(row => AnimalMapper.toDomain(row))
  }

  async findAdoptable(params: {
    eventId?: string
    page: number
    perPage: number
  }): Promise<{ items: Animal[]; total: number }> {
    const { eventId, page, perPage } = params

    const where = {
      ownerId: null,
      ...(eventId ? { adoptionEventId: eventId } : {}),
    }

    const [rows, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        take: perPage,
        skip: (page - 1) * perPage,
        include: { breed: { include: { specie: true } } },
      }),
      this.prisma.animal.count({ where }),
    ])

    return { items: rows.map(row => AnimalMapper.toDomain(row)), total }
  }

  async save(animal: Animal): Promise<void> {
    const data = AnimalMapper.toPersistence(animal)
    const exists = await this.prisma.animal.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (exists) {
      await this.prisma.animal.update({ where: { id: data.id }, data })
    } else {
      await this.prisma.animal.create({ data })
    }

    const newOwnerIds = animal.ownerIds.getNewItems()
    const removedOwnerIds = animal.ownerIds.getRemovedItems()

    if (newOwnerIds.length > 0 || removedOwnerIds.length > 0) {
      await this.prisma.animal.update({
        where: { id: data.id },
        data: {
          owners: {
            connect: newOwnerIds.map(id => ({ id })),
            disconnect: removedOwnerIds.map(id => ({ id })),
          },
        },
      })
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.animalMedia.deleteMany({ where: { animalId: id } }),
      this.prisma.animalUserVisibility.deleteMany({ where: { animalId: id } }),
      this.prisma.medication.deleteMany({ where: { animalId: id } }),
      this.prisma.deworming.deleteMany({ where: { animalId: id } }),
      this.prisma.vaccine.deleteMany({ where: { animalId: id } }),
      this.prisma.veterinarianAuthorization.deleteMany({ where: { animalId: id } }),
      this.prisma.medicalRecord.deleteMany({ where: { animalId: id } }),
      this.prisma.animal.deleteMany({ where: { id } }),
    ])
  }
}
