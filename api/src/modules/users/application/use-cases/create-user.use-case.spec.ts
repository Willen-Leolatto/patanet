import { ConflictException } from '@nestjs/common'
import { HashingPort } from '@shared/application/ports/hashing.port'
import { UserRepository } from '../../domain/repositories/user.repository'
import { CreateUserUseCase } from './create-user.use-case'

const mockUserRepo = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByIdWithAnimalsCount: jest.fn(),
  findByEmail: jest.fn(),
  findByGoogleId: jest.fn(),
  findByUsername: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  purge: jest.fn(),
})

const mockHashingPort = (): jest.Mocked<HashingPort> => ({
  hash: jest.fn(),
  compare: jest.fn(),
})

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let userRepo: jest.Mocked<UserRepository>
  let hashingPort: jest.Mocked<HashingPort>

  beforeEach(() => {
    userRepo = mockUserRepo()
    hashingPort = mockHashingPort()
    useCase = new CreateUserUseCase(userRepo, hashingPort)
  })

  it('creates user on happy path', async () => {
    userRepo.findByEmail.mockResolvedValue(null)
    userRepo.findByUsername.mockResolvedValue(null)
    hashingPort.hash.mockResolvedValue('hashed_password')
    userRepo.save.mockResolvedValue(undefined)

    const result = await useCase.execute({
      name: 'João Silva',
      username: 'joao',
      email: 'joao@example.com',
      password: 'password123',
    })

    expect(result.name).toBe('João Silva')
    expect(result.username).toBe('joao')
    expect(result.email).toBe('joao@example.com')
    expect(result.password).toBe('hashed_password')
    expect(userRepo.save).toHaveBeenCalledTimes(1)
  })

  it('throws ConflictException when email already exists', async () => {
    const existingUser = {
      id: { toValue: () => 'existing-id' },
      email: 'joao@example.com',
    } as any
    userRepo.findByEmail.mockResolvedValue(existingUser)

    await expect(
      useCase.execute({
        name: 'João',
        username: 'joao2',
        email: 'joao@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException)

    expect(userRepo.save).not.toHaveBeenCalled()
  })

  it('throws ConflictException when username already exists', async () => {
    userRepo.findByEmail.mockResolvedValue(null)
    const existingUser = {
      id: { toValue: () => 'existing-id' },
      username: 'joao',
    } as any
    userRepo.findByUsername.mockResolvedValue(existingUser)

    await expect(
      useCase.execute({
        name: 'João',
        username: 'joao',
        email: 'new@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException)

    expect(userRepo.save).not.toHaveBeenCalled()
  })
})
