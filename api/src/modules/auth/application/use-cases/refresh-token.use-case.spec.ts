import { UnauthorizedException } from '@nestjs/common'
import { RefreshTokenUseCase } from './refresh-token.use-case'
import { TokenGeneratorPort } from '../ports/token-generator.port'

const mockTokenGenerator = (): jest.Mocked<TokenGeneratorPort> => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
})

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase
  let tokenGenerator: jest.Mocked<TokenGeneratorPort>

  beforeEach(() => {
    tokenGenerator = mockTokenGenerator()
    useCase = new RefreshTokenUseCase(tokenGenerator)
  })

  it('returns new token pair on happy path', async () => {
    tokenGenerator.verifyRefreshToken.mockResolvedValue({ sub: 'user-id-123' })
    tokenGenerator.generateAccessToken.mockResolvedValue('new-access-token')
    tokenGenerator.generateRefreshToken.mockResolvedValue('new-refresh-token')

    const result = await useCase.execute({
      refreshToken: 'valid-refresh-token',
    })

    expect(result.accessToken).toBe('new-access-token')
    expect(result.refreshToken).toBe('new-refresh-token')
    expect(tokenGenerator.verifyRefreshToken).toHaveBeenCalledWith(
      'valid-refresh-token',
    )
    expect(tokenGenerator.generateAccessToken).toHaveBeenCalledWith({
      sub: 'user-id-123',
    })
    expect(tokenGenerator.generateRefreshToken).toHaveBeenCalledWith({
      sub: 'user-id-123',
    })
  })

  it('throws UnauthorizedException when refresh token is undefined', async () => {
    await expect(useCase.execute({ refreshToken: undefined })).rejects.toThrow(
      UnauthorizedException,
    )

    expect(tokenGenerator.verifyRefreshToken).not.toHaveBeenCalled()
  })

  it('throws UnauthorizedException when refresh token is invalid/expired', async () => {
    tokenGenerator.verifyRefreshToken.mockRejectedValue(
      new UnauthorizedException(),
    )

    await expect(
      useCase.execute({ refreshToken: 'expired-token' }),
    ).rejects.toThrow(UnauthorizedException)

    expect(tokenGenerator.generateAccessToken).not.toHaveBeenCalled()
  })
})
