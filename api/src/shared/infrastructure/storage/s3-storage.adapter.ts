import { Injectable } from '@nestjs/common'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { StoragePort } from '../../application/ports/storage.port'
import { EnvService } from '../../../env/env.service'

@Injectable()
export class S3StorageAdapter extends StoragePort {
  private readonly client: S3Client
  private readonly endpoint: string
  private readonly bucketName: string

  constructor(private readonly envService: EnvService) {
    super()
    this.endpoint = envService.get('AWS_ENDPOINT')
    this.bucketName = envService.get('AWS_BUCKET_NAME')
    this.client = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: true,
    })
  }

  async upload(file: {
    buffer: Buffer
    mimetype: string
    originalname: string
  }): Promise<{ url: string }> {
    const uploadId = randomUUID()
    const uniqueFileName = `${uploadId}-${file.originalname}`

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueFileName,
          ContentType: file.mimetype,
          Body: file.buffer,
          ACL: 'public-read',
        }),
      )

      return { url: `${this.endpoint}/${this.bucketName}/${uniqueFileName}` }
    } catch (err) {
      console.warn(
        `[S3StorageAdapter] S3/MinIO upload failed (${(err as Error).message}), using resilient inline data URL.`,
      )
      const base64 = file.buffer.toString('base64')
      return { url: `data:${file.mimetype};base64,${base64}` }
    }
  }

  async delete(url: string): Promise<void> {
    if (!url || url.startsWith('data:')) return

    const key = url.split('/').pop()
    if (!key) return

    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
      )
    } catch (err) {
      console.warn(`[S3StorageAdapter] S3 delete failed (${(err as Error).message}).`)
    }
  }
}
