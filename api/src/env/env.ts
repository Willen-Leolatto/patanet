import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  APP_PORT: z.coerce.number().optional().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRATION: z.string(),
  CORS_WHITELIST: z.string().optional(),
  AWS_ENDPOINT: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_BUCKET_NAME: z.string(),
  GOOGLE_CLIENT_ID_WEB: z.string().optional(),
  GOOGLE_CLIENT_ID_ANDROID: z.string().optional(),
  ADMIN_EMAILS: z.string().optional().default('dev.patanet@gmail.com'),
  REPORT_FORWARDING_EMAIL: z.string().optional().default('dev.patanet@gmail.com'),
  PUBLIC_AUTHORITY_REPORT_WEBHOOK: z.string().optional().default(''),
  PLAY_STORE_ACCOUNT_DELETION_URL: z.string().optional().default('https://patanet.app.br/delete-account'),
  PRIVACY_POLICY_URL: z.string().optional().default('https://patanet.app.br/privacy'),
  TERMS_OF_SERVICE_URL: z.string().optional().default('https://patanet.app.br/terms'),
  CURRENT_TERMS_VERSION: z.string().optional().default('1.0'),
})

export type Env = z.infer<typeof envSchema>

