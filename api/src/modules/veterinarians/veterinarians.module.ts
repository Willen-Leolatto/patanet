import { Module } from '@nestjs/common'
import { AnimalsModule } from '@modules/animals/animals.module'
import { UsersModule } from '@modules/users/users.module'
import { VeterinarianProfileRepository } from './domain/repositories/veterinarian-profile.repository'
import { PrismaVeterinarianProfileRepository } from './infrastructure/persistence/prisma/repositories/prisma-veterinarian-profile.repository'
import { VeterinarianAuthorizationRepository } from './domain/repositories/veterinarian-authorization.repository'
import { PrismaVeterinarianAuthorizationRepository } from './infrastructure/persistence/prisma/repositories/prisma-veterinarian-authorization.repository'
import { ApplyVeterinarianUseCase } from './application/use-cases/apply-veterinarian.use-case'
import { ReviewVeterinarianApplicationUseCase } from './application/use-cases/review-veterinarian-application.use-case'
import { AuthorizeVeterinarianUseCase } from './application/use-cases/authorize-veterinarian.use-case'
import { VetController } from './presentation/controllers/vet.controller'
import { AdminVetController } from './presentation/controllers/admin-vet.controller'
import { AnimalVetController } from './presentation/controllers/animal-vet.controller'

@Module({
  imports: [AnimalsModule, UsersModule],
  controllers: [VetController, AdminVetController, AnimalVetController],
  providers: [
    {
      provide: VeterinarianProfileRepository,
      useClass: PrismaVeterinarianProfileRepository,
    },
    {
      provide: VeterinarianAuthorizationRepository,
      useClass: PrismaVeterinarianAuthorizationRepository,
    },
    ApplyVeterinarianUseCase,
    ReviewVeterinarianApplicationUseCase,
    AuthorizeVeterinarianUseCase,
  ],
  exports: [VeterinarianProfileRepository, VeterinarianAuthorizationRepository],
})
export class VeterinariansModule {}
