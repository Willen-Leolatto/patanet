import { SpecieRepository } from '../../domain/repositories/specie.repository'
import { GetSpeciesUseCase } from './get-species.use-case'

const mockSpecieRepo = (): jest.Mocked<SpecieRepository> => ({
  findMany: jest.fn(),
})

describe('GetSpeciesUseCase', () => {
  let useCase: GetSpeciesUseCase
  let specieRepo: jest.Mocked<SpecieRepository>

  beforeEach(() => {
    specieRepo = mockSpecieRepo()
    useCase = new GetSpeciesUseCase(specieRepo)
  })

  it('returns species', async () => {
    specieRepo.findMany.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({ page: 1, perPage: 10 })

    expect(specieRepo.findMany).toHaveBeenCalledWith({
      query: undefined,
      page: 1,
      perPage: 10,
    })
    expect(result.total).toBe(0)
  })

  it('passes query filter', async () => {
    specieRepo.findMany.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ query: 'Dog', page: 1, perPage: 5 })

    expect(specieRepo.findMany).toHaveBeenCalledWith({
      query: 'Dog',
      page: 1,
      perPage: 5,
    })
  })
})
