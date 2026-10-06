import 'reflect-metadata'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { buildSwaggerDocument } from './swagger.config'

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false })
  const document = buildSwaggerDocument(app)

  const outPath = join(__dirname, '../../docs/swagger.json')
  writeFileSync(outPath, JSON.stringify(document, null, 2))

  await app.close()
  console.log(`swagger.json exportado em ${outPath}`)
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
