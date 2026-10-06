import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import { SwaggerModule } from '@nestjs/swagger'
import { buildSwaggerDocument, SWAGGER_UI_PATH } from './swagger/swagger.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const corsWhitelist = (process.env.CORS_WHITELIST ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  // Falls back to reflecting the request origin (previous permissive
  // behavior) until CORS_WHITELIST is configured in the deployment
  // environment, so this fix can ship without risking an outage by
  // locking out the app's own frontend origins on deploy.
  app.enableCors({
    origin: corsWhitelist.length > 0 ? corsWhitelist : true,
  })

  // CSP padrao do helmet bloqueia os assets inline que o Swagger UI usa;
  // desligamos so essa diretiva (o resto do helmet continua ativo).
  app.use(helmet({ contentSecurityPolicy: false }))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  const swaggerDocument = buildSwaggerDocument(app)
  SwaggerModule.setup(SWAGGER_UI_PATH, app, swaggerDocument)

  await app.listen(process.env.APP_PORT ?? 3000)
}
bootstrap()
