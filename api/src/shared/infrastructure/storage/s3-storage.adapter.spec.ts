import { S3Client } from '@aws-sdk/client-s3'
import { S3StorageAdapter } from './s3-storage.adapter'
import { EnvService } from '../../../env/env.service'

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    PutObjectCommand: jest.fn().mockImplementation(params => params),
    DeleteObjectCommand: jest.fn().mockImplementation(params => params),
  }
})

describe('S3StorageAdapter', () => {
  let adapter: S3StorageAdapter
  let mockSend: jest.Mock
  let mockEnvService: jest.Mocked<EnvService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockEnvService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          AWS_ENDPOINT: 'http://localhost:9000',
          AWS_BUCKET_NAME: 'test-bucket',
          AWS_ACCESS_KEY_ID: 'test-key',
          AWS_SECRET_ACCESS_KEY: 'test-secret',
        }
        return values[key] as never
      }),
    } as unknown as jest.Mocked<EnvService>

    adapter = new S3StorageAdapter(mockEnvService)
    mockSend = (S3Client as jest.Mock).mock.results[0].value.send
  })

  describe('upload', () => {
    it('should upload a file and return the URL', async () => {
      mockSend.mockResolvedValue({})

      const file = {
        buffer: Buffer.from('test content'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      }

      const result = await adapter.upload(file)

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(result.url).toContain('http://localhost:9000')
      expect(result.url).toContain('test-bucket')
      expect(result.url).toContain('test.jpg')
    })

    it('should generate a unique filename for each upload', async () => {
      mockSend.mockResolvedValue({})

      const file = {
        buffer: Buffer.from('test content'),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      }

      const result1 = await adapter.upload(file)
      const result2 = await adapter.upload(file)

      expect(result1.url).not.toEqual(result2.url)
    })
  })

  describe('delete', () => {
    it('should delete a file by URL', async () => {
      mockSend.mockResolvedValue({})

      await adapter.delete('http://localhost:9000/test-bucket/uuid-test.jpg')

      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('should not send delete command when URL produces no key', async () => {
      await adapter.delete('')

      expect(mockSend).not.toHaveBeenCalled()
    })
  })
})
