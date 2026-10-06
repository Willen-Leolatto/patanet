import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { EventRepository } from '../../domain/repositories/event.repository'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { UserRole } from '@modules/users/domain/entities/user'

export interface TransferAdoptionTutorshipInput {
  eventId: string
  animalId: string
  newOwnerId: string
  requesterId: string
}

/**
 * A instituicao confirma a adocao: passa a tutoria de um pet sem dono,
 * listado em um dos seus eventos de adocao, para o novo tutor. Reaproveita
 * Animal.adopt() -- o mesmo metodo de dominio usado quando um usuario adota
 * um pet por conta propria (AdoptAnimalUseCase, no modulo animals).
 */
@Injectable()
export class TransferAdoptionTutorshipUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly animalRepository: AnimalRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: TransferAdoptionTutorshipInput): Promise<void> {
    const event = await this.eventRepository.findById(input.eventId)
    if (!event) throw new NotFoundException('Event not found')

    if (event.authorId !== input.requesterId) {
      throw new ForbiddenException(
        'Only the event author can transfer tutorship',
      )
    }

    const requester = await this.userRepository.findById(input.requesterId)
    if (!requester || requester.role !== UserRole.INSTITUTION) {
      throw new ForbiddenException('Only institutions can transfer tutorship')
    }

    const animal = await this.animalRepository.findById(input.animalId)
    if (!animal) throw new NotFoundException('Animal not found')

    if (animal.ownerId !== null) {
      throw new ForbiddenException('Animal already has an owner')
    }

    if (animal.adoptionEventId !== input.eventId) {
      throw new ForbiddenException('Animal is not listed under this event')
    }

    const newOwner = await this.userRepository.findById(input.newOwnerId)
    if (!newOwner) throw new NotFoundException('New owner not found')

    animal.adopt(input.newOwnerId)
    await this.animalRepository.save(animal)
  }
}
