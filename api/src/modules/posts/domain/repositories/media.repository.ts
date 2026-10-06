import { Media } from '../entities/media'

export abstract class MediaRepository {
  abstract findByPostId(postId: string): Promise<Media[]>
  abstract save(media: Media): Promise<void>
  abstract deleteByPostId(postId: string): Promise<void>
}
