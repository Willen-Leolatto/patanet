export abstract class TokenGeneratorPort {
  abstract generateAccessToken(payload: { sub: string }): Promise<string>
  abstract generateRefreshToken(payload: { sub: string }): Promise<string>
  abstract verifyRefreshToken(token: string): Promise<{ sub: string }>
}
