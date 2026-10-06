import { Deworming } from './deworming'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Deworming entity', () => {
  it('exposes all props via getters', () => {
    const deworming = Deworming.reconstitute(
      {
        name: 'Frontline',
        observations: 'Monthly',
        clinic: 'VetClinic',
        appliedAt: new Date('2024-01-01'),
        nextDose: new Date('2024-02-01'),
        animalId: 'animal-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('deworming-1'),
    )

    expect(deworming.name).toBe('Frontline')
    expect(deworming.observations).toBe('Monthly')
    expect(deworming.clinic).toBe('VetClinic')
    expect(deworming.appliedAt).toBeInstanceOf(Date)
    expect(deworming.nextDose).toBeInstanceOf(Date)
    expect(deworming.animalId).toBe('animal-1')
    expect(deworming.createdAt).toBeInstanceOf(Date)
    expect(deworming.updatedAt).toBeInstanceOf(Date)
  })

  it('updates props with update()', () => {
    const deworming = Deworming.create({
      name: 'Frontline',
      observations: null,
      clinic: null,
      appliedAt: null,
      nextDose: null,
      animalId: 'animal-1',
    })

    deworming.update({ name: 'Updated', clinic: 'NewClinic' })

    expect(deworming.name).toBe('Updated')
    expect(deworming.clinic).toBe('NewClinic')
  })
})
