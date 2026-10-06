import { BreedRepository } from '../../domain/repositories/breed.repository'
import { GetBreedsUseCase } from './get-breeds.use-case'

const mockBreedRepo = (): jest.Mocked<BreedRepository> => ({
  findById: jest.fn(),
  findMany: jest.fn(),
})

describe('GetBreedsUseCase', () => {
  let useCase: GetBreedsUseCase
  let breedRepo: jest.Mocked<BreedRepository>

  beforeEach(() => {
    breedRepo = mockBreedRepo()
    useCase = new GetBreedsUseCase(breedRepo)
  })

  it('returns breeds', async () => {
    breedRepo.findMany.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({ page: 1, perPage: 10 })

    expect(breedRepo.findMany).toHaveBeenCalledWith({
      query: undefined,
      specieId: undefined,
      page: 1,
      perPage: 10,
    })
    expect(result.total).toBe(0)
  })

  it('passes query and specieId filters', async () => {
    breedRepo.findMany.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({
      query: 'Lab',
      specieId: 'specie-1',
      page: 1,
      perPage: 5,
    })

    expect(breedRepo.findMany).toHaveBeenCalledWith({
      query: 'Lab',
      specieId: 'specie-1',
      page: 1,
      perPage: 5,
    })
  })
})
