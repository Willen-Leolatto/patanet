import { Module } from '@nestjs/common'
import { AnimalsModule } from '@modules/animals/animals.module'
import { PetshopsModule } from '@modules/petshops/petshops.module'
import { UsersModule } from '@modules/users/users.module'
import { AdoptionRequestRepository } from './domain/repositories/adoption-request.repository'
import { AdoptionCustodyTransferRepository } from './domain/repositories/adoption-custody-transfer.repository'
import { PrismaAdoptionRequestRepository } from './infrastructure/persistence/prisma/repositories/prisma-adoption-request.repository'
import { PrismaAdoptionCustodyTransferRepository } from './infrastructure/persistence/prisma/repositories/prisma-adoption-custody-transfer.repository'
import { CreateAdoptionRequestUseCase } from './application/use-cases/create-adoption-request.use-case'
import { RejectAdoptionRequestUseCase } from './application/use-cases/reject-adoption-request.use-case'
import { TransferPetCustodyUseCase } from './application/use-cases/transfer-pet-custody.use-case'
import { AnimalAdoptionRequestsController } from './presentation/controllers/animal-adoption-requests.controller'
import { AdoptionRequestsController } from './presentation/controllers/adoption-requests.controller'

// Importa AnimalsModule/PetshopsModule (nunca o inverso) para evitar
// dependencia circular -- mesmo padrao usado por veterinarians/medical-records.
// UsersModule e so pro AuthGuard local dos controllers resolver UserRepository.
@Module({
  imports: [AnimalsModule, PetshopsModule, UsersModule],
  controllers: [AnimalAdoptionRequestsController, AdoptionRequestsController],
  providers: [
    {
      provide: AdoptionRequestRepository,
      useClass: PrismaAdoptionRequestRepository,
    },
    {
      provide: AdoptionCustodyTransferRepository,
      useClass: PrismaAdoptionCustodyTransferRepository,
    },
    CreateAdoptionRequestUseCase,
    RejectAdoptionRequestUseCase,
    TransferPetCustodyUseCase,
  ],
  exports: [AdoptionRequestRepository, AdoptionCustodyTransferRepository],
})
export class AdoptionsModule {}
