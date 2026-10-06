import { AnimalMediaRepository } from '../../domain/repositories/animal-media.repository'
import { GetAnimalMediasUseCase } from './get-animal-medias.use-case'

const mockAnimalMediaRepo = (): jest.Mocked<AnimalMediaRepository> => ({
  findById: jest.fn(),
  findByAnimal: jest.fn(),
  countByAnimal: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('GetAnimalMediasUseCase', () => {
  let useCase: GetAnimalMediasUseCase
  let mediaRepo: jest.Mocked<AnimalMediaRepository>

  beforeEach(() => {
    mediaRepo = mockAnimalMediaRepo()
    useCase = new GetAnimalMediasUseCase(mediaRepo)
  })

  it('returns medias for animal', async () => {
    mediaRepo.findByAnimal.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({
      animalId: 'animal-1',
      page: 1,
      perPage: 10,
    })

    expect(mediaRepo.findByAnimal).toHaveBeenCalledWith('animal-1', {
      page: 1,
      perPage: 10,
    })
    expect(result.total).toBe(0)
  })
})
