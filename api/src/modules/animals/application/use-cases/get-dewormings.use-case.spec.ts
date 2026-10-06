import { DewormingRepository } from '../../domain/repositories/deworming.repository'
import { GetDewormingsUseCase } from './get-dewormings.use-case'

const mockDewormingRepo = (): jest.Mocked<DewormingRepository> => ({
  findById: jest.fn(),
  findByAnimal: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('GetDewormingsUseCase', () => {
  let useCase: GetDewormingsUseCase
  let dewormingRepo: jest.Mocked<DewormingRepository>

  beforeEach(() => {
    dewormingRepo = mockDewormingRepo()
    useCase = new GetDewormingsUseCase(dewormingRepo)
  })

  it('returns dewormings for animal', async () => {
    dewormingRepo.findByAnimal.mockResolvedValue([])

    const result = await useCase.execute({ animalId: 'animal-1' })

    expect(dewormingRepo.findByAnimal).toHaveBeenCalledWith('animal-1')
    expect(result).toEqual([])
  })
})
