import { Animal } from '../entities/animal'

export interface CanRemoveTutorResult {
  allowed: boolean
  reason?: string
}

export class TutorManagementDomainService {
  canAddTutor(animal: Animal, requesterId: string): boolean {
    return animal.ownerId === requesterId
  }

  canRemoveTutor(
    animal: Animal,
    requesterId: string,
    targetId: string,
    currentOwnerIds: string[],
  ): CanRemoveTutorResult {
    const primaryId = animal.ownerId

    if (primaryId && targetId === primaryId) {
      return { allowed: false, reason: 'Cannot remove primary tutor' }
    }

    const isPrimary = primaryId ? requesterId === primaryId : false

    const canSelfRemoveAfterTransfer =
      !!animal.createdByOwnerId &&
      requesterId === animal.createdByOwnerId &&
      !!primaryId &&
      requesterId !== primaryId &&
      targetId === requesterId

    if (!isPrimary && !canSelfRemoveAfterTransfer) {
      return { allowed: false, reason: 'Only primary tutor can remove owners' }
    }

    if (isPrimary && targetId === requesterId) {
      return { allowed: false, reason: 'Primary tutor cannot remove self' }
    }

    if (this.isLastTutor(currentOwnerIds.length)) {
      return { allowed: false, reason: 'Cannot remove the last tutor' }
    }

    return { allowed: true }
  }

  canTransferOwnership(animal: Animal, requesterId: string): boolean {
    return animal.ownerId === requesterId
  }

  isLastTutor(ownerCount: number): boolean {
    return ownerCount <= 1
  }
}
