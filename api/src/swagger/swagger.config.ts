import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'

export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('PataNet API')
    .setDescription('API do ecossistema PataNet (usuarios, pets, adocao, eventos, feed e moderacao)')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build()

  return SwaggerModule.createDocument(app, config)
}

export const SWAGGER_UI_PATH = 'api/docs'
