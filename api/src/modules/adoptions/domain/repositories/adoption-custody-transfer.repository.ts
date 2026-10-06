import { AdoptionCustodyTransfer } from '../entities/adoption-custody-transfer'

export abstract class AdoptionCustodyTransferRepository {
  abstract findById(id: string): Promise<AdoptionCustodyTransfer | null>
  abstract findByAdoptionRequestId(
    adoptionRequestId: string,
  ): Promise<AdoptionCustodyTransfer | null>
  abstract save(transfer: AdoptionCustodyTransfer): Promise<void>
}
