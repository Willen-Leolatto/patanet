import { forwardRef, Module } from '@nestjs/common'
import { EnvModule } from 'src/env/env.module'
import { CreateUserUseCase } from './application/use-cases/create-user.use-case'
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case'
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case'
import { FindUsersUseCase } from './application/use-cases/find-users.use-case'
import { UpdatePasswordUseCase } from './application/use-cases/update-password.use-case'
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case'
import { LinkGoogleAccountUseCase } from './application/use-cases/link-google-account.use-case'
import { UnlinkGoogleAccountUseCase } from './application/use-cases/unlink-google-account.use-case'
import { ChangeUserRoleUseCase } from './application/use-cases/change-user-role.use-case'
import { AcceptTermsUseCase } from './application/use-cases/accept-terms.use-case'
import { DeleteAccountByCredentialsUseCase } from './application/use-cases/delete-account-by-credentials.use-case'
import { UserRepository } from './domain/repositories/user.repository'
import { PrismaUserRepository } from './infrastructure/persistence/prisma/repositories/prisma-user.repository'
import { UsersController } from './presentation/controllers/users.controller'
import { AccountDeletionController } from './presentation/controllers/account-deletion.controller'
import { AnimalsModule } from '../animals/animals.module'

@Module({
  imports: [
    // DeleteUserUseCase precisa de AnimalRepository: pets tutorados pelo
    // usuario viram "sem dono" em vez de excluidos quando a conta e
    // desativada (exclusao logica). forwardRef porque AnimalsModule ja
    // importa UsersModule (para validar o requesterId ao criar um pet) -
    // sem forwardRef dos dois lados essa referencia circular quebraria a
    // inicializacao do Nest. Ver import espelhado em animals.module.ts.
    forwardRef(() => AnimalsModule),
    EnvModule,
  ],
  controllers: [UsersController, AccountDeletionController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    CreateUserUseCase,
    FindUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    UpdatePasswordUseCase,
    DeleteUserUseCase,
    LinkGoogleAccountUseCase,
    UnlinkGoogleAccountUseCase,
    ChangeUserRoleUseCase,
    AcceptTermsUseCase,
    DeleteAccountByCredentialsUseCase,
  ],
  exports: [UserRepository],
})
export class UsersModule {}
