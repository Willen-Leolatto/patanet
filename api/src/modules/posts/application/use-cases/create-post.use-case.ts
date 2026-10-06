import { Injectable } from '@nestjs/common'
import { Post } from '../../domain/entities/post'
import { PostRepository } from '../../domain/repositories/post.repository'
import { MediaRepository } from '../../domain/repositories/media.repository'
import { Media, MediaType } from '../../domain/entities/media'

export interface CreatePostInput {
  authorId: string
  subtitle: string
  petIds?: string[]
  medias?: { path: string; type: MediaType }[]
}

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly mediaRepository: MediaRepository,
  ) {}

  async execute(input: CreatePostInput): Promise<Post> {
    const post = Post.create({
      subtitle: input.subtitle,
      authorId: input.authorId,
      petIds: input.petIds ?? [],
    })

    await this.postRepository.save(post)

    await Promise.all(
      (input.medias ?? []).map(m => {
        const media = Media.create({
          path: m.path,
          type: m.type,
          postId: post.id.toValue(),
        })
        return this.mediaRepository.save(media)
      }),
    )

    return post
  }
}
