import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { EventRepository } from '../../domain/repositories/event.repository'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { UserRole } from '@modules/users/domain/entities/user'

export interface RegisterAdoptableAnimalInput {
  eventId: string
  animalId: string
  requesterId: string
}

/**
 * Uma instituicao (User com role INSTITUTION) vincula um pet sem dono a
 * um dos seus eventos de adocao. O pet passa a aparecer na listagem de
 * adocao filtrada por evento (GET /animals/adoptable?eventId=...). Nao
 * altera o dono do pet -- isso so acontece quando alguem o adota (ver
 * AdoptAnimalUseCase, no modulo animals, ou TransferAdoptionTutorshipUseCase
 * abaixo).
 */
@Injectable()
export class RegisterAdoptableAnimalUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly animalRepository: AnimalRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: RegisterAdoptableAnimalInput): Promise<void> {
    const event = await this.eventRepository.findById(input.eventId)
    if (!event) throw new NotFoundException('Event not found')

    if (event.authorId !== input.requesterId) {
      throw new ForbiddenException(
        'Only the event author can register adoptable animals',
      )
    }

    const requester = await this.userRepository.findById(input.requesterId)
    if (!requester || requester.role !== UserRole.INSTITUTION) {
      throw new ForbiddenException(
        'Only institutions can register adoptable animals',
      )
    }

    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal) throw new NotFoundException('Animal not found')

    if (animal.ownerId !== null) {
      throw new ForbiddenException('Animal already has an owner')
    }

    animal.linkAdoptionEvent(input.eventId)
    await this.animalRepository.save(animal)
  }
}
