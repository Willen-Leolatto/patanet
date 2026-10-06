import { Module } from '@nestjs/common'
import { AnimalsModule } from '@modules/animals/animals.module'
import { UsersModule } from '@modules/users/users.module'
import { VeterinariansModule } from '@modules/veterinarians/veterinarians.module'
import { MedicalRecordRepository } from './domain/repositories/medical-record.repository'
import { PrismaMedicalRecordRepository } from './infrastructure/persistence/prisma/repositories/prisma-medical-record.repository'
import { CreateMedicalRecordUseCase } from './application/use-cases/create-medical-record.use-case'
import { AnimalMedicalRecordsController } from './presentation/controllers/animal-medical-records.controller'

@Module({
  // UsersModule aqui e so pro AuthGuard local do controller resolver
  // UserRepository (mesmo motivo do veterinarians.module.ts).
  imports: [AnimalsModule, VeterinariansModule, UsersModule],
  controllers: [AnimalMedicalRecordsController],
  providers: [
    {
      provide: MedicalRecordRepository,
      useClass: PrismaMedicalRecordRepository,
    },
    CreateMedicalRecordUseCase,
  ],
  exports: [MedicalRecordRepository],
})
export class MedicalRecordsModule {}
