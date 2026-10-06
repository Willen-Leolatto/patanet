import { Medication } from './medication'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

describe('Medication entity', () => {
  it('exposes all props via getters', () => {
    const medication = Medication.reconstitute(
      {
        name: 'Amoxicillin',
        startAt: new Date('2024-01-01'),
        endAt: new Date('2024-01-10'),
        dosage: '250mg',
        frequency: 'twice daily',
        clinic: 'VetClinic',
        observations: 'With food',
        animalId: 'animal-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('medication-1'),
    )

    expect(medication.name).toBe('Amoxicillin')
    expect(medication.startAt).toBeInstanceOf(Date)
    expect(medication.endAt).toBeInstanceOf(Date)
    expect(medication.dosage).toBe('250mg')
    expect(medication.frequency).toBe('twice daily')
    expect(medication.clinic).toBe('VetClinic')
    expect(medication.observations).toBe('With food')
    expect(medication.animalId).toBe('animal-1')
    expect(medication.createdAt).toBeInstanceOf(Date)
    expect(medication.updatedAt).toBeInstanceOf(Date)
  })

  it('updates props with update()', () => {
    const medication = Medication.create({
      name: 'Amoxicillin',
      startAt: null,
      endAt: null,
      dosage: null,
      frequency: null,
      clinic: null,
      observations: null,
      animalId: 'animal-1',
    })

    medication.update({ name: 'Updated', dosage: '500mg' })

    expect(medication.name).toBe('Updated')
    expect(medication.dosage).toBe('500mg')
  })
})
