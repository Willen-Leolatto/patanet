import { UnauthorizedException } from '@nestjs/common'
import { HashingPort } from '@shared/application/ports/hashing.port'
import { UserRepository } from '@modules/users/domain/repositories/user.repository'
import { User } from '@modules/users/domain/entities/user'
import { SignInUseCase } from './sign-in.use-case'
import { TokenGeneratorPort } from '../ports/token-generator.port'

const mockUserRepo = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByIdWithAnimalsCount: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByGoogleId: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  purge: jest.fn(),
})

const mockHashingPort = (): jest.Mocked<HashingPort> => ({
  hash: jest.fn(),
  compare: jest.fn(),
})

const mockTokenGenerator = (): jest.Mocked<TokenGeneratorPort> => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
})

function makeFakeUser(overrides: Partial<{ isActive: boolean }> = {}) {
  return {
    id: { toValue: () => 'user-id-123' },
    username: 'johndoe',
    email: 'john@example.com',
    password: 'hashed_password',
    isActive: overrides.isActive ?? true,
  } as unknown as User
}

describe('SignInUseCase', () => {
  let useCase: SignInUseCase
  let userRepo: jest.Mocked<UserRepository>
  let hashingPort: jest.Mocked<HashingPort>
  let tokenGenerator: jest.Mocked<TokenGeneratorPort>

  beforeEach(() => {
    userRepo = mockUserRepo()
    hashingPort = mockHashingPort()
    tokenGenerator = mockTokenGenerator()
    useCase = new SignInUseCase(userRepo, hashingPort, tokenGenerator)
  })

  it('returns tokens on happy path (username lookup)', async () => {
    const fakeUser = makeFakeUser()
    userRepo.findByUsername.mockResolvedValue(fakeUser)
    hashingPort.compare.mockResolvedValue(true)
    tokenGenerator.generateAccessToken.mockResolvedValue('access-token')
    tokenGenerator.generateRefreshToken.mockResolvedValue('refresh-token')

    const result = await useCase.execute({
      username: 'johndoe',
      password: 'password123',
    })

    expect(result.accessToken).toBe('access-token')
    expect(result.refreshToken).toBe('refresh-token')
    expect(tokenGenerator.generateAccessToken).toHaveBeenCalledWith({
      sub: 'user-id-123',
    })
    expect(tokenGenerator.generateRefreshToken).toHaveBeenCalledWith({
      sub: 'user-id-123',
    })
    expect(userRepo.save).not.toHaveBeenCalled()
  })

  it('falls back to email lookup when username not found', async () => {
    const fakeUser = makeFakeUser()
    userRepo.findByUsername.mockResolvedValue(null)
    userRepo.findByEmail.mockResolvedValue(fakeUser)
    hashingPort.compare.mockResolvedValue(true)
    tokenGenerator.generateAccessToken.mockResolvedValue('access-token')
    tokenGenerator.generateRefreshToken.mockResolvedValue('refresh-token')

    const result = await useCase.execute({
      username: 'john@example.com',
      password: 'password123',
    })

    expect(result.accessToken).toBe('access-token')
    expect(userRepo.findByEmail).toHaveBeenCalledWith('john@example.com')
  })

  it('throws UnauthorizedException when user not found', async () => {
    userRepo.findByUsername.mockResolvedValue(null)
    userRepo.findByEmail.mockResolvedValue(null)

    await expect(
      useCase.execute({ username: 'unknown', password: 'pass' }),
    ).rejects.toThrow(UnauthorizedException)

    expect(hashingPort.compare).not.toHaveBeenCalled()
    expect(tokenGenerator.generateAccessToken).not.toHaveBeenCalled()
  })

  it('throws UnauthorizedException when password is wrong', async () => {
    const fakeUser = makeFakeUser()
    userRepo.findByUsername.mockResolvedValue(fakeUser)
    hashingPort.compare.mockResolvedValue(false)

    await expect(
      useCase.execute({ username: 'johndoe', password: 'wrongpass' }),
    ).rejects.toThrow(UnauthorizedException)

    expect(tokenGenerator.generateAccessToken).not.toHaveBeenCalled()
  })

  it('throws UnauthorizedException for an inactive account (no reactivation)', async () => {
    const fakeUser = makeFakeUser({ isActive: false })
    userRepo.findByUsername.mockResolvedValue(fakeUser)
    hashingPort.compare.mockResolvedValue(true)

    await expect(
      useCase.execute({ username: 'johndoe', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException)

    expect(userRepo.save).not.toHaveBeenCalled()
    expect(tokenGenerator.generateAccessToken).not.toHaveBeenCalled()
  })
})
