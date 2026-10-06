import { forwardRef, Module } from '@nestjs/common'
import { UsersModule } from '@modules/users/users.module'
import { PetshopRepository } from './domain/repositories/petshop.repository'
import { PrismaPetshopRepository } from './infrastructure/persistence/prisma/repositories/prisma-petshop.repository'
import { ApplyPetshopUseCase } from './application/use-cases/apply-petshop.use-case'
import { ReviewPetshopApplicationUseCase } from './application/use-cases/review-petshop-application.use-case'
import { PetshopsController } from './presentation/controllers/petshops.controller'
import { AdminPetshopsController } from './presentation/controllers/admin-petshops.controller'

@Module({
  // forwardRef: PetshopsModule <- AnimalsModule <- UsersModule ja formam um
  // ciclo (Users<->Animals, ambos com forwardRef); precisamos de UsersModule
  // aqui so para o AuthGuard local (@UseGuards(AuthGuard)) resolver
  // UserRepository nos controllers deste modulo.
  imports: [forwardRef(() => UsersModule)],
  controllers: [PetshopsController, AdminPetshopsController],
  providers: [
    { provide: PetshopRepository, useClass: PrismaPetshopRepository },
    ApplyPetshopUseCase,
    ReviewPetshopApplicationUseCase,
  ],
  exports: [PetshopRepository],
})
export class PetshopsModule {}
