import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'

export interface AdoptAnimalInput {
  animalId: string
  requesterId: string
}

/**
 * Permite que qualquer usuario adote um pet sem dono -- seja um pet que
 * ficou "sem dono" apos a desativacao de todos os seus tutores (ver
 * DeleteUserUseCase, no modulo users), seja um pet cadastrado por uma
 * instituicao em um evento de adocao (ver RegisterAdoptableAnimalUseCase
 * e TransferAdoptionTutorshipUseCase, no modulo events). Reaproveita
 * Animal.adopt(), o mesmo metodo de dominio usado pela transferencia de
 * tutoria feita pela instituicao.
 */
@Injectable()
export class AdoptAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: AdoptAnimalInput): Promise<void> {
    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal) throw new NotFoundException('Animal not found')

    if (animal.ownerId !== null) {
      throw new ForbiddenException('Animal already has an owner')
    }

    const user = await this.userRepository.findById(input.requesterId)
    if (!user) throw new NotFoundException('User not found')

    animal.adopt(input.requesterId)
    await this.animalRepository.save(animal)
  }
}
