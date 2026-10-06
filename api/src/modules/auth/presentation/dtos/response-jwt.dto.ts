export class ResponseJwtDto {
  readonly access_token: string
  readonly refresh_token: string

  constructor(accessToken: string, refreshToken: string) {
    this.access_token = accessToken
    this.refresh_token = refreshToken
  }
}
