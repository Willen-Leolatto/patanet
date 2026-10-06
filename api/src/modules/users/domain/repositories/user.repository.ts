import { User } from '../entities/user'

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>
  /**
   * Igual a findById, mas populando animalsCount via JOIN de contagem
   * (loadRelationCountAndMap), como findMany já faz. Existe como método
   * separado propositalmente: findById é chamado por AuthGuard em toda
   * requisição autenticada, então não deve ganhar esse JOIN extra. Use
   * este método apenas onde a contagem de animais precisa ser exibida.
   */
  abstract findByIdWithAnimalsCount(id: string): Promise<User | null>
  abstract findByEmail(email: string): Promise<User | null>
  abstract findByUsername(username: string): Promise<User | null>
  abstract findByGoogleId(googleId: string): Promise<User | null>
  abstract findMany(params: {
    query?: string
    page: number
    perPage: number
  }): Promise<{ items: User[]; total: number }>
  abstract save(user: User): Promise<void>
  abstract delete(id: string): Promise<void>
  /**
   * LGPD/Play Store: expurgo total. Diferente de delete() -- reatribui
   * conteudo gerado (posts, comentarios) a uma conta sentinela "Conta
   * Excluida" pra preservar threads de terceiros, apaga o que e
   * exclusivamente pessoal (likes, conexoes, presencas em eventos,
   * perfis de vet/petshop) e so entao remove o User. Ver
   * DeleteUserUseCase.
   */
  abstract purge(id: string): Promise<void>
}
