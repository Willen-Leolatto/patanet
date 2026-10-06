import { INestApplication } from '@nestjs/common'
import request from 'supertest'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<AuthTokens> {
  const response = await request(app.getHttpServer())
    .post('/auth/session')
    .send({ email, password })

  const accessToken = response.body.access_token
  const refreshToken = response.body.refresh_token

  // Guard global de LGPD (TermsAcceptedGuard) bloqueia todas as rotas
  // privadas com 403 enquanto os termos vigentes nao forem aceitos --
  // aceita aqui pra que o token retornado ja funcione nos demais specs.
  if (accessToken) {
    await request(app.getHttpServer())
      .post('/users/terms/accept')
      .set('Authorization', `Bearer ${accessToken}`)
  }

  return { accessToken, refreshToken }
}

// Guard global de LGPD (TermsAcceptedGuard) bloqueia todas as rotas
// privadas com 403 enquanto os termos vigentes nao forem aceitos. Specs que
// obtem o token via chamada inline a /auth/session (nao via loginUser)
// precisam chamar isto logo depois de logar.
export async function acceptTerms(
  app: INestApplication,
  accessToken: string,
): Promise<void> {
  await request(app.getHttpServer())
    .post('/users/terms/accept')
    .set('Authorization', `Bearer ${accessToken}`)
}
