import { Injectable, NotFoundException } from '@nestjs/common'
import { PostRepository } from '../../domain/repositories/post.repository'
import { MediaRepository } from '../../domain/repositories/media.repository'
import { Media, MediaType } from '../../domain/entities/media'
import { StoragePort } from '@shared/application/ports/storage.port'

export interface UpdatePostInput {
  requesterId: string
  postId: string
  subtitle?: string
  petIds?: string[]
  medias?: { path: string; type: MediaType }[]
}

@Injectable()
export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly storagePort: StoragePort,
  ) {}

  async execute(input: UpdatePostInput): Promise<void> {
    const post = await this.postRepository.findById(input.postId)
    if (!post) throw new NotFoundException('Post not found')
    if (post.authorId !== input.requesterId)
      throw new NotFoundException('Post not found')

    post.update({
      subtitle: input.subtitle,
      petIds: input.petIds,
    })

    await this.postRepository.save(post)

    if (input.medias && input.medias.length > 0) {
      const existingMedias = await this.mediaRepository.findByPostId(
        input.postId,
      )
      await Promise.all(
        existingMedias.map(m => this.storagePort.delete(m.path)),
      )
      await this.mediaRepository.deleteByPostId(input.postId)

      await Promise.all(
        input.medias.map(m => {
          const media = Media.create({
            path: m.path,
            type: m.type,
            postId: input.postId,
          })
          return this.mediaRepository.save(media)
        }),
      )
    }
  }
}
