import { Vaccine } from './vaccine'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Vaccine entity', () => {
  it('exposes all props via getters', () => {
    const vaccine = Vaccine.reconstitute(
      {
        name: 'Raiva',
        observations: 'Annual',
        clinic: 'VetClinic',
        appliedAt: new Date('2024-01-01'),
        nextDose: new Date('2025-01-01'),
        animalId: 'animal-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('vaccine-1'),
    )

    expect(vaccine.name).toBe('Raiva')
    expect(vaccine.observations).toBe('Annual')
    expect(vaccine.clinic).toBe('VetClinic')
    expect(vaccine.appliedAt).toBeInstanceOf(Date)
    expect(vaccine.nextDose).toBeInstanceOf(Date)
    expect(vaccine.animalId).toBe('animal-1')
    expect(vaccine.createdAt).toBeInstanceOf(Date)
    expect(vaccine.updatedAt).toBeInstanceOf(Date)
  })

  it('updates props with update()', () => {
    const vaccine = Vaccine.create({
      name: 'Raiva',
      observations: '',
      clinic: 'VetClinic',
      appliedAt: null,
      nextDose: null,
      animalId: 'animal-1',
    })

    vaccine.update({ name: 'Updated', clinic: 'NewClinic' })

    expect(vaccine.name).toBe('Updated')
    expect(vaccine.clinic).toBe('NewClinic')
  })
})
