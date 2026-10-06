import { Injectable, NotFoundException } from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { StoragePort } from '@shared/application/ports/storage.port'

export interface UpdateAnimalInput {
  id: string
  requesterId: string
  name?: string
  about?: string
  image?: string | null
  imageCover?: string | null
  weight?: number
  size?: string
  gender?: string
  birthDate?: string
  adoptionDate?: string
  breedId?: string
}

@Injectable()
export class UpdateAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: UpdateAnimalInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.id)
    if (!animal || !animal.ownerIds.exists(input.requesterId)) {
      throw new NotFoundException('Animal not found')
    }

    if (input.image !== undefined && input.image !== animal.image) {
      if (animal.image) await this.storagePort.delete(animal.image)
    }
    if (
      input.imageCover !== undefined &&
      input.imageCover !== animal.imageCover
    ) {
      if (animal.imageCover) await this.storagePort.delete(animal.imageCover)
    }

    animal.update({
      name: input.name,
      about: input.about,
      image: input.image,
      imageCover: input.imageCover,
      weight: input.weight,
      size: input.size,
      gender: input.gender,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      adoptionDate: input.adoptionDate
        ? new Date(input.adoptionDate)
        : undefined,
      breedId: input.breedId,
    })

    await this.animalRepository.save(animal)
  }
}
