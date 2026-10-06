import { VaccineRepository } from '../../domain/repositories/vaccine.repository'
import { GetVaccinesUseCase } from './get-vaccines.use-case'

const mockVaccineRepo = (): jest.Mocked<VaccineRepository> => ({
  findById: jest.fn(),
  findByAnimal: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('GetVaccinesUseCase', () => {
  let useCase: GetVaccinesUseCase
  let vaccineRepo: jest.Mocked<VaccineRepository>

  beforeEach(() => {
    vaccineRepo = mockVaccineRepo()
    useCase = new GetVaccinesUseCase(vaccineRepo)
  })

  it('returns vaccines for animal', async () => {
    vaccineRepo.findByAnimal.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({
      animalId: 'animal-1',
      page: 1,
      perPage: 10,
    })

    expect(vaccineRepo.findByAnimal).toHaveBeenCalledWith('animal-1', {
      page: 1,
      perPage: 10,
    })
    expect(result.total).toBe(0)
  })
})
