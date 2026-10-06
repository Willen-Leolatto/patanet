import { randomUUID } from 'node:crypto'
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { StoragePort } from '@shared/application/ports/storage.port'
import { AnimalRepository } from '@modules/animals/domain/repositories/animal.repository'
import { PetshopRepository } from '@modules/petshops/domain/repositories/petshop.repository'
import { AdoptionRequestStatus } from '../../domain/entities/adoption-request'
import { AdoptionRequestRepository } from '../../domain/repositories/adoption-request.repository'

export interface TransferPetCustodyInput {
  adoptionRequestId: string
  requesterId: string
}

export interface TransferPetCustodyOutput {
  adoptionCustodyTransferId: string
  transferDocumentUrl: string
}

/**
 * Transferencia atomica de custodia da Petshop pro tutor adotante, com
 * emissao do Termo Digital de Adocao (ver business_rules.md secao Adocao
 * Responsavel). Injeta PrismaService diretamente (unica excecao ao padrao
 * repositorio-only) porque a operacao precisa ser atomica em 3 tabelas
 * (adoption_requests, adoption_custody_transfers, animals) numa unica
 * transacao -- nenhuma combinacao dos repositorios de domino cobre isso
 * sem abrir mao da atomicidade.
 */
@Injectable()
export class TransferPetCustodyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adoptionRequestRepository: AdoptionRequestRepository,
    private readonly animalRepository: AnimalRepository,
    private readonly petshopRepository: PetshopRepository,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(
    input: TransferPetCustodyInput,
  ): Promise<TransferPetCustodyOutput> {
    const request = await this.adoptionRequestRepository.findById(
      input.adoptionRequestId,
    )
    if (!request) throw new NotFoundException('Adoption request not found')
    if (request.status !== AdoptionRequestStatus.PENDING) {
      throw new ForbiddenException('Esta candidatura ja foi decidida')
    }

    const petshop = await this.petshopRepository.findById(request.petshopId)
    if (!petshop || petshop.ownerUserId !== input.requesterId) {
      throw new ForbiddenException(
        'Apenas a petshop responsavel pode aprovar esta candidatura',
      )
    }

    const animal = await this.animalRepository.findById(request.animalId)
    if (!animal) throw new NotFoundException('Animal not found')

    const termoDigital = {
      titulo: 'Termo Digital de Adocao Responsavel',
      petId: animal.id.toValue(),
      petNome: animal.name,
      petshopId: petshop.id.toValue(),
      petshopNome: petshop.businessName,
      adotanteId: request.requesterUserId,
      adoptionRequestId: request.id.toValue(),
      dataTransferencia: new Date().toISOString(),
    }
    const termoBuffer = Buffer.from(JSON.stringify(termoDigital, null, 2))
    const { url: transferDocumentUrl } = await this.storagePort.upload({
      buffer: termoBuffer,
      mimetype: 'application/json',
      originalname: `termo-adocao-${request.id.toValue()}.json`,
    })

    const adoptionCustodyTransferId = randomUUID()

    await this.prisma.$transaction([
      this.prisma.adoptionRequest.update({
        where: { id: request.id.toValue() },
        data: { status: 'APPROVED' },
      }),
      this.prisma.adoptionCustodyTransfer.create({
        data: {
          id: adoptionCustodyTransferId,
          animalId: animal.id.toValue(),
          adoptionRequestId: request.id.toValue(),
          fromPetshopId: petshop.id.toValue(),
          toUserId: request.requesterUserId,
          transferDocumentUrl,
        },
      }),
      this.prisma.animal.update({
        where: { id: animal.id.toValue() },
        data: {
          ownerId: request.requesterUserId,
          isForAdoption: false,
          petshopId: null,
          owners: { connect: { id: request.requesterUserId } },
        },
      }),
    ])

    return { adoptionCustodyTransferId, transferDocumentUrl }
  }
}
