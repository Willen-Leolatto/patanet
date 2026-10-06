export abstract class StoragePort {
  abstract upload(file: {
    buffer: Buffer
    mimetype: string
    originalname: string
  }): Promise<{ url: string }>
  abstract delete(url: string): Promise<void>
}
