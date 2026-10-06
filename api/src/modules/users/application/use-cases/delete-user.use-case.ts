import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from '../../domain/repositories/user.repository'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'

export interface DeleteUserInput {
  id: string
}

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(input: DeleteUserInput): Promise<void> {
    const user = await this.userRepository.findById(input.id)
    if (!user) throw new NotFoundException('User not found')

    const tutoredAnimals = await this.animalRepository.findAllTutoredBy(
      input.id,
    )

    for (const animal of tutoredAnimals) {
      const remainingOwnerIds = animal.ownerIds
        .getItems()
        .filter(ownerId => ownerId !== input.id)

      animal.removeOwner(input.id)

      if (remainingOwnerIds.length === 0) {
        // Este usuario era o unico tutor: o pet nao e mais excluido (ver
        // direcionamento do usuario sobre adocao/instituicoes) - fica
        // "sem dono", disponivel para adocao, com todos os seus dados
        // (fotos, vacinas, vermifugacoes, medicamentos) intactos.
        animal.becomeOwnerless()
      } else if (animal.ownerId === input.id) {
        // Este usuario era o Tutor Principal: promove outro tutor
        // remanescente antes de sair, para o pet nunca ficar sem
        // Tutor Principal enquanto ainda houver tutores (invariante ja
        // existente).
        animal.transferPrimary(remainingOwnerIds[0])
      }

      await this.animalRepository.save(animal)
    }

    // LGPD/Play Store: expurgo total (ver UserRepository.purge). Conteudo
    // gerado (posts, comentarios, eventos) e preservado sob uma conta
    // sentinela "Conta Excluida"; o resto (likes, conexoes, presencas,
    // perfis de vet/petshop) e removido de fato junto com o User.
    await this.userRepository.purge(input.id)
  }
}
