export interface GoogleTokenPayload {
  googleId: string
  email: string
  emailVerified: boolean
  name: string | null
  picture: string | null
}

export abstract class GoogleTokenVerifierPort {
  abstract verify(idToken: string): Promise<GoogleTokenPayload>
}
