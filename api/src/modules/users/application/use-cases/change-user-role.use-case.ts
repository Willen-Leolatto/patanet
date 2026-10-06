import { Injectable, NotFoundException } from '@nestjs/common'
import { User, UserRole } from '../../domain/entities/user'
import { UserRepository } from '../../domain/repositories/user.repository'

export interface ChangeUserRoleInput {
  id: string
  role: UserRole
}

/**
 * Promove/rebaixa um usuario para/de instituicao. Restrito a admin (ver
 * AdminGuard no controller) - nao existe hoje um fluxo de auto-cadastro
 * como instituicao, por decisao do direcionamento sobre familia/adocao:
 * "instituicao" e um role em User, atribuido por um administrador.
 */
@Injectable()
export class ChangeUserRoleUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: ChangeUserRoleInput): Promise<User> {
    const user = await this.userRepository.findById(input.id)
    if (!user) throw new NotFoundException('User not found')

    user.changeRole(input.role)
    await this.userRepository.save(user)
    return user
  }
}
