import { ForbiddenException, Injectable } from '@nestjs/common'
import { VaccineRepository } from '@modules/animals/domain/repositories/vaccine.repository'
import { Vaccine } from '@modules/animals/domain/entities/vaccine'
import { VeterinarianAuthorizationRepository } from '@modules/veterinarians/domain/repositories/veterinarian-authorization.repository'
import { MedicalRecord } from '../../domain/entities/medical-record'
import { MedicalRecordRepository } from '../../domain/repositories/medical-record.repository'

export interface OfficialVaccineInput {
  name: string
  observations?: string
  clinic: string
  batchNumber?: string
  manufacturer?: string
  appliedAt?: string
  nextDose?: string
}

export interface CreateMedicalRecordInput {
  animalId: string
  veterinarianId: string
  notes: string
  examRequestUrls?: string[] | null
  vaccines?: OfficialVaccineInput[]
}

/**
 * Registro oficial de prontuario: so um veterinario com
 * VeterinarianAuthorization ativa pro pet (ver AuthorizeVeterinarianUseCase)
 * pode assinar. Vacinas informadas junto entram como oficiais
 * (isOfficial=true, com lote/fabricante/assinatura do CRMV).
 */
@Injectable()
export class CreateMedicalRecordUseCase {
  constructor(
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly vaccineRepository: VaccineRepository,
    private readonly veterinarianAuthorizationRepository: VeterinarianAuthorizationRepository,
  ) {}

  async execute(input: CreateMedicalRecordInput): Promise<MedicalRecord> {
    const authorization =
      await this.veterinarianAuthorizationRepository.findActiveByAnimalAndVet(
        input.animalId,
        input.veterinarianId,
      )
    if (!authorization) {
      throw new ForbiddenException(
        'Veterinario nao autorizado a atuar sobre este pet',
      )
    }

    const record = MedicalRecord.create({
      animalId: input.animalId,
      veterinarianId: input.veterinarianId,
      notes: input.notes,
      examRequestUrls: input.examRequestUrls ?? null,
      signedAt: new Date(),
    })
    await this.medicalRecordRepository.save(record)

    for (const v of input.vaccines ?? []) {
      const vaccine = Vaccine.create({
        animalId: input.animalId,
        name: v.name,
        observations: v.observations ?? '',
        clinic: v.clinic,
        appliedAt: v.appliedAt ? new Date(v.appliedAt) : null,
        nextDose: v.nextDose ? new Date(v.nextDose) : null,
        isOfficial: true,
        batchNumber: v.batchNumber ?? null,
        manufacturer: v.manufacturer ?? null,
        veterinarianId: input.veterinarianId,
      })
      await this.vaccineRepository.save(vaccine)
    }

    return record
  }
}
