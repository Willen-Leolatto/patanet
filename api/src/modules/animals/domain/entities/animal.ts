import { AggregateRoot } from '@shared/domain/aggregate-root'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { OwnerIdList } from '../watched-list/owner-id-list'

export interface BreedDetail {
  id: string
  name: string
  image: string | null
  specie?: { id: string; name: string; image?: string | null }
}

export interface OwnerDetail {
  id: string
  name: string
  username: string
  email: string
  image: string | null
  imageCover: string | null
}

export interface AnimalProps {
  name: string
  about: string | null
  image: string | null
  imageCover: string | null
  weight: number
  size: string
  gender: string
  birthDate: Date | null
  adoptionDate: Date | null
  breedId: string
  ownerId: string | null
  createdByOwnerId: string | null
  ownerIds: OwnerIdList
  // Preenchido quando uma instituicao vincula um pet sem dono a um dos
  // seus eventos de adocao (ver RegisterAdoptableAnimalUseCase, no modulo
  // de events). Nao tem FK -- segue o mesmo padrao de ownerId/postId no
  // resto da base (referencia "solta", sem constraint no banco).
  adoptionEventId: string | null
  // Wave 3 (modulo Petshop / Adocao Responsavel): pets cadastrados por uma
  // Petshop PJ aprovada entram obrigatoriamente nessa modalidade -- nunca
  // ha campo de preco/venda no schema, entao "proibicao de venda" e
  // estrutural. petshopId identifica a PJ custodiante enquanto isForAdoption
  // for true; ambos sao limpos quando a adocao e efetivada (ver
  // TransferPetCustodyUseCase).
  isForAdoption: boolean
  petshopId: string | null
  createdAt: Date
  updatedAt: Date
  // Enriched data populated when loading with relations
  breed?: BreedDetail
  owners?: OwnerDetail[]
  mediasCount?: number
}

export class Animal extends AggregateRoot<AnimalProps> {
  get name() {
    return this.props.name
  }
  get about() {
    return this.props.about
  }
  get image() {
    return this.props.image
  }
  get imageCover() {
    return this.props.imageCover
  }
  get weight() {
    return this.props.weight
  }
  get size() {
    return this.props.size
  }
  get gender() {
    return this.props.gender
  }
  get birthDate() {
    return this.props.birthDate
  }
  get adoptionDate() {
    return this.props.adoptionDate
  }
  get breedId() {
    return this.props.breedId
  }
  get ownerId() {
    return this.props.ownerId
  }
  get createdByOwnerId() {
    return this.props.createdByOwnerId
  }
  get ownerIds() {
    return this.props.ownerIds
  }
  get adoptionEventId() {
    return this.props.adoptionEventId
  }
  get isForAdoption() {
    return this.props.isForAdoption
  }
  get petshopId() {
    return this.props.petshopId
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }
  get breed() {
    return this.props.breed
  }
  get owners() {
    return this.props.owners
  }
  get mediasCount() {
    return this.props.mediasCount
  }

  addOwner(userId: string): void {
    this.props.ownerIds.add(userId)
    this.props.updatedAt = new Date()
  }

  removeOwner(userId: string): void {
    this.props.ownerIds.remove(userId)
    this.props.updatedAt = new Date()
  }

  transferPrimary(newOwnerId: string): void {
    this.props.ownerId = newOwnerId
    this.props.updatedAt = new Date()
  }

  /**
   * Deixa o pet sem dono, sem remover nenhum dado -- usado quando o ultimo
   * tutor de um animal desativa a conta (ver DeleteUserUseCase). O pet
   * segue existindo normalmente e volta a poder ser adotado.
   */
  becomeOwnerless(): void {
    this.props.ownerId = null
    this.props.updatedAt = new Date()
  }

  /**
   * Um pet sem dono passa a ter um novo tutor -- seja por adocao direta
   * (AdoptAnimalUseCase, modulo animals) seja por transferencia feita por
   * uma instituicao a partir de um evento de adocao
   * (TransferAdoptionTutorshipUseCase, modulo events). A validacao de que
   * o animal realmente esta sem dono e responsabilidade do use case
   * chamador, seguindo o padrao ja usado pelos demais metodos desta
   * entidade.
   */
  adopt(newOwnerId: string): void {
    this.props.ownerId = newOwnerId
    this.props.ownerIds.add(newOwnerId)
    // Uma vez adotado, o pet deixa de estar disponivel e de custodia da
    // petshop -- vale tanto pra adocao direta quanto pra transferencia
    // formal de custodia (ver TransferPetCustodyUseCase).
    this.props.isForAdoption = false
    this.props.petshopId = null
    this.props.updatedAt = new Date()
  }

  /** Cadastro por Petshop PJ aprovada: pet entra em modalidade de adocao responsavel. */
  markForAdoption(petshopId: string): void {
    this.props.isForAdoption = true
    this.props.petshopId = petshopId
    this.props.updatedAt = new Date()
  }

  /** Vincula o pet (sem dono) a um evento de adocao de uma instituicao. */
  linkAdoptionEvent(eventId: string): void {
    this.props.adoptionEventId = eventId
    this.props.updatedAt = new Date()
  }

  /** Remove o pet da listagem de adocao de um evento, sem excluir nada. */
  unlinkAdoptionEvent(): void {
    this.props.adoptionEventId = null
    this.props.updatedAt = new Date()
  }

  update(
    data: Partial<
      Pick<
        AnimalProps,
        | 'name'
        | 'about'
        | 'image'
        | 'imageCover'
        | 'weight'
        | 'size'
        | 'gender'
        | 'birthDate'
        | 'adoptionDate'
        | 'breedId'
      >
    >,
  ): void {
    Object.assign(this.props, data)
    this.props.updatedAt = new Date()
  }

  setMediasCount(count: number): void {
    this.props.mediasCount = count
  }

  static create(
    props: Omit<
      AnimalProps,
      | 'createdAt'
      | 'updatedAt'
      | 'adoptionEventId'
      | 'isForAdoption'
      | 'petshopId'
    > &
      Partial<
        Pick<AnimalProps, 'adoptionEventId' | 'isForAdoption' | 'petshopId'>
      >,
    id?: UniqueEntityID,
  ): Animal {
    return new Animal(
      {
        ...props,
        adoptionEventId: props.adoptionEventId ?? null,
        isForAdoption: props.isForAdoption ?? false,
        petshopId: props.petshopId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(props: AnimalProps, id: UniqueEntityID): Animal {
    return new Animal(props, id)
  }
}
