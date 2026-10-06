import { MedicationRepository } from '../../domain/repositories/medication.repository'
import { GetMedicationsUseCase } from './get-medications.use-case'

const mockMedicationRepo = (): jest.Mocked<MedicationRepository> => ({
  findById: jest.fn(),
  findByAnimal: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('GetMedicationsUseCase', () => {
  let useCase: GetMedicationsUseCase
  let medicationRepo: jest.Mocked<MedicationRepository>

  beforeEach(() => {
    medicationRepo = mockMedicationRepo()
    useCase = new GetMedicationsUseCase(medicationRepo)
  })

  it('returns medications for animal', async () => {
    medicationRepo.findByAnimal.mockResolvedValue([])

    const result = await useCase.execute({ animalId: 'animal-1' })

    expect(medicationRepo.findByAnimal).toHaveBeenCalledWith('animal-1')
    expect(result).toEqual([])
  })
})
