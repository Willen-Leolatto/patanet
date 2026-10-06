import { forwardRef, Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module'
import { PetshopsModule } from '../petshops/petshops.module'

// Repository Ports
import { AnimalRepository } from './domain/repositories/animal.repository'
import { VaccineRepository } from './domain/repositories/vaccine.repository'
import { DewormingRepository } from './domain/repositories/deworming.repository'
import { MedicationRepository } from './domain/repositories/medication.repository'
import { AnimalMediaRepository } from './domain/repositories/animal-media.repository'
import { AnimalVisibilityRepository } from './domain/repositories/animal-visibility.repository'
import { BreedRepository } from './domain/repositories/breed.repository'
import { SpecieRepository } from './domain/repositories/specie.repository'

// Prisma Repositories
import { PrismaAnimalRepository } from './infrastructure/persistence/prisma/repositories/prisma-animal.repository'
import { PrismaVaccineRepository } from './infrastructure/persistence/prisma/repositories/prisma-vaccine.repository'
import { PrismaDewormingRepository } from './infrastructure/persistence/prisma/repositories/prisma-deworming.repository'
import { PrismaMedicationRepository } from './infrastructure/persistence/prisma/repositories/prisma-medication.repository'
import { PrismaAnimalMediaRepository } from './infrastructure/persistence/prisma/repositories/prisma-animal-media.repository'
import { PrismaAnimalVisibilityRepository } from './infrastructure/persistence/prisma/repositories/prisma-animal-visibility.repository'
import { PrismaBreedRepository } from './infrastructure/persistence/prisma/repositories/prisma-breed.repository'
import { PrismaSpecieRepository } from './infrastructure/persistence/prisma/repositories/prisma-specie.repository'

// Domain Services
import { TutorManagementDomainService } from './domain/services/tutor-management.domain-service'

// Use Cases
import { CreateAnimalUseCase } from './application/use-cases/create-animal.use-case'
import { GetAnimalByIdUseCase } from './application/use-cases/get-animal-by-id.use-case'
import { UpdateAnimalUseCase } from './application/use-cases/update-animal.use-case'
import { DeleteAnimalUseCase } from './application/use-cases/delete-animal.use-case'
import { GetAnimalsByOwnerUseCase } from './application/use-cases/get-animals-by-owner.use-case'
import { AddTutorUseCase } from './application/use-cases/add-tutor.use-case'
import { RemoveTutorUseCase } from './application/use-cases/remove-tutor.use-case'
import { TransferPrimaryTutorUseCase } from './application/use-cases/transfer-primary-tutor.use-case'
import { ToggleVisibilityUseCase } from './application/use-cases/toggle-visibility.use-case'
import { AdoptAnimalUseCase } from './application/use-cases/adopt-animal.use-case'
import { ListAdoptableAnimalsUseCase } from './application/use-cases/list-adoptable-animals.use-case'
import { CreateVaccineUseCase } from './application/use-cases/create-vaccine.use-case'
import { UpdateVaccineUseCase } from './application/use-cases/update-vaccine.use-case'
import { DeleteVaccineUseCase } from './application/use-cases/delete-vaccine.use-case'
import { GetVaccinesUseCase } from './application/use-cases/get-vaccines.use-case'
import { CreateDewormingUseCase } from './application/use-cases/create-deworming.use-case'
import { UpdateDewormingUseCase } from './application/use-cases/update-deworming.use-case'
import { DeleteDewormingUseCase } from './application/use-cases/delete-deworming.use-case'
import { GetDewormingsUseCase } from './application/use-cases/get-dewormings.use-case'
import { CreateMedicationUseCase } from './application/use-cases/create-medication.use-case'
import { UpdateMedicationUseCase } from './application/use-cases/update-medication.use-case'
import { DeleteMedicationUseCase } from './application/use-cases/delete-medication.use-case'
import { GetMedicationsUseCase } from './application/use-cases/get-medications.use-case'
import { GetAnimalMediasUseCase } from './application/use-cases/get-animal-medias.use-case'
import { AddAnimalMediaUseCase } from './application/use-cases/add-animal-media.use-case'
import { DeleteAnimalMediaUseCase } from './application/use-cases/delete-animal-media.use-case'
import { GetBreedsUseCase } from './application/use-cases/get-breeds.use-case'
import { GetSpeciesUseCase } from './application/use-cases/get-species.use-case'

// Controllers
import { AnimalsController } from './presentation/controllers/animals.controller'
import { OwnersController } from './presentation/controllers/owners.controller'
import { VaccinesController } from './presentation/controllers/vaccines.controller'
import { DewormingsController } from './presentation/controllers/dewormings.controller'
import { MedicationsController } from './presentation/controllers/medications.controller'
import { AnimalMediasController } from './presentation/controllers/animal-medias.controller'
import { BreedsController } from './presentation/controllers/breeds.controller'
import { SpeciesController } from './presentation/controllers/species.controller'
import { HidePetsController } from './presentation/controllers/hide-pets.controller'

@Module({
  imports: [
    // DeleteUserUseCase (em UsersModule) precisa de AnimalRepository, entao
    // UsersModule importa AnimalsModule de volta (com forwardRef). Sem
    // forwardRef dos dois lados essa referencia circular quebraria a
    // inicializacao do Nest. Ver import espelhado em users.module.ts.
    forwardRef(() => UsersModule),
    PetshopsModule,
  ],
  controllers: [
    SpeciesController,
    BreedsController,
    OwnersController,
    AnimalMediasController,
    VaccinesController,
    DewormingsController,
    MedicationsController,
    HidePetsController,
    AnimalsController,
  ],
  providers: [
    // Repository bindings
    { provide: AnimalRepository, useClass: PrismaAnimalRepository },
    { provide: VaccineRepository, useClass: PrismaVaccineRepository },
    { provide: DewormingRepository, useClass: PrismaDewormingRepository },
    { provide: MedicationRepository, useClass: PrismaMedicationRepository },
    { provide: AnimalMediaRepository, useClass: PrismaAnimalMediaRepository },
    {
      provide: AnimalVisibilityRepository,
      useClass: PrismaAnimalVisibilityRepository,
    },
    { provide: BreedRepository, useClass: PrismaBreedRepository },
    { provide: SpecieRepository, useClass: PrismaSpecieRepository },
    // Domain services
    TutorManagementDomainService,
    // Use cases
    CreateAnimalUseCase,
    GetAnimalByIdUseCase,
    UpdateAnimalUseCase,
    DeleteAnimalUseCase,
    GetAnimalsByOwnerUseCase,
    AddTutorUseCase,
    RemoveTutorUseCase,
    TransferPrimaryTutorUseCase,
    ToggleVisibilityUseCase,
    AdoptAnimalUseCase,
    ListAdoptableAnimalsUseCase,
    CreateVaccineUseCase,
    UpdateVaccineUseCase,
    DeleteVaccineUseCase,
    GetVaccinesUseCase,
    CreateDewormingUseCase,
    UpdateDewormingUseCase,
    DeleteDewormingUseCase,
    GetDewormingsUseCase,
    CreateMedicationUseCase,
    UpdateMedicationUseCase,
    DeleteMedicationUseCase,
    GetMedicationsUseCase,
    GetAnimalMediasUseCase,
    AddAnimalMediaUseCase,
    DeleteAnimalMediaUseCase,
    GetBreedsUseCase,
    GetSpeciesUseCase,
  ],
  exports: [
    AnimalRepository,
    VaccineRepository,
    DewormingRepository,
    MedicationRepository,
    AnimalMediaRepository,
    BreedRepository,
    SpecieRepository,
  ],
})
export class AnimalsModule {}
