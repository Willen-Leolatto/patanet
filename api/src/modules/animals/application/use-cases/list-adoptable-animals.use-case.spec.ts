import { AnimalRepository } from '../../domain/repositories/animal.repository'
import { ListAdoptableAnimalsUseCase } from './list-adoptable-animals.use-case'

const mockAnimalRepo = (): jest.Mocked<AnimalRepository> => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  findByOwner: jest.fn(),
  findAllTutoredBy: jest.fn(),
  findAdoptable: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
})

describe('ListAdoptableAnimalsUseCase', () => {
  let useCase: ListAdoptableAnimalsUseCase
  let animalRepo: jest.Mocked<AnimalRepository>

  beforeEach(() => {
    animalRepo = mockAnimalRepo()
    useCase = new ListAdoptableAnimalsUseCase(animalRepo)
  })

  it('delegates to the repository', async () => {
    animalRepo.findAdoptable.mockResolvedValue({ items: [], total: 0 })

    const result = await useCase.execute({ page: 1, perPage: 10 })

    expect(animalRepo.findAdoptable).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
    })
    expect(result).toEqual({ items: [], total: 0 })
  })

  it('forwards the eventId filter', async () => {
    animalRepo.findAdoptable.mockResolvedValue({ items: [], total: 0 })

    await useCase.execute({ eventId: 'event-1', page: 1, perPage: 10 })

    expect(animalRepo.findAdoptable).toHaveBeenCalledWith({
      eventId: 'event-1',
      page: 1,
      perPage: 10,
    })
  })
})
