import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Animal } from '../../domain/entities/animal'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { BreedRepository } from '../../domain/repositories/breed.repository'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { PetshopRepository } from '@modules/petshops/domain/repositories/petshop.repository'
import { PetshopVerificationStatus } from '@modules/petshops/domain/entities/petshop'
import { OwnerIdList } from '../../domain/watched-list/owner-id-list'

export interface CreateAnimalInput {
  name: string
  about?: string
  image?: string | null
  imageCover?: string | null
  weight: number
  size: string
  gender: string
  birthDate?: string
  adoptionDate?: string
  breedId: string
  requesterId: string
  // Wave 3 (Petshop PJ / Adocao Responsavel): quando true, o pet e
  // cadastrado sob custodia da petshop do requester (sem tutor ate a
  // adocao ser efetivada -- ver TransferPetCustodyUseCase) em vez de ficar
  // com o requester como dono.
  isForAdoption?: boolean
}

@Injectable()
export class CreateAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly breedRepository: BreedRepository,
    private readonly userRepository: UserRepository,
    private readonly petshopRepository: PetshopRepository,
  ) {}

  async execute(input: CreateAnimalInput): Promise<Animal> {
    const user = await this.userRepository.findById(input.requesterId)
    if (!user) throw new NotFoundException('User not found')

    const breed = await this.breedRepository.findById(input.breedId)
    if (!breed) throw new NotFoundException('Breed not found')

    let petshopId: string | null = null
    if (input.isForAdoption) {
      const petshops = await this.petshopRepository.findByOwnerUserId(
        input.requesterId,
      )
      const approved = petshops.find(
        p => p.status === PetshopVerificationStatus.APPROVED,
      )
      if (!approved) {
        throw new BadRequestException(
          'Apenas uma Petshop PJ aprovada pode cadastrar pets para adocao responsavel',
        )
      }
      petshopId = approved.id.toValue()
    }

    const animal = Animal.create({
      name: input.name,
      about: input.about ?? null,
      image: input.image ?? null,
      imageCover: input.imageCover ?? null,
      weight: input.weight,
      size: input.size,
      gender: input.gender,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      adoptionDate: input.adoptionDate ? new Date(input.adoptionDate) : null,
      breedId: input.breedId,
      // Pet cadastrado por uma petshop pra adocao fica sem tutor ate a
      // transferencia formal de custodia (ver TransferPetCustodyUseCase).
      ownerId: petshopId ? null : input.requesterId,
      createdByOwnerId: input.requesterId,
      isForAdoption: Boolean(petshopId),
      petshopId,
      // OwnerIdList precisa ser construida vazia e populada via addOwner()
      // (mesmo padrao usado em AddTutorUseCase/AdoptAnimalUseCase). Passar
      // o id direto no construtor o marca como item "inicial", nao "novo" --
      // PrismaAnimalRepository.save() so cria a linha na tabela de juncao
      // animal_users para itens retornados por ownerIds.getNewItems(), entao
      // o pet ficava com owner_id preenchido mas nenhum tutor na relacao
      // many-to-many, sumindo de "Meus Pets" e do perfil (que consultam via
      // essa relacao) mesmo tendo sido criado com sucesso.
      ownerIds: new OwnerIdList(),
    })
    if (!petshopId) animal.addOwner(input.requesterId)

    await this.animalRepository.save(animal)
    return animal
  }
}
