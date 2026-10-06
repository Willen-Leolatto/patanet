import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module'

import { PostRepository } from './domain/repositories/post.repository'
import { CommentRepository } from './domain/repositories/comment.repository'
import { LikeRepository } from './domain/repositories/like.repository'
import { MediaRepository } from './domain/repositories/media.repository'
import { ConnectionRepository } from './domain/repositories/connection.repository'
import { BlockRepository } from './domain/repositories/block.repository'

import { PrismaPostRepository } from './infrastructure/persistence/prisma/repositories/prisma-post.repository'
import { PrismaCommentRepository } from './infrastructure/persistence/prisma/repositories/prisma-comment.repository'
import { PrismaLikeRepository } from './infrastructure/persistence/prisma/repositories/prisma-like.repository'
import { PrismaMediaRepository } from './infrastructure/persistence/prisma/repositories/prisma-media.repository'
import { PrismaConnectionRepository } from './infrastructure/persistence/prisma/repositories/prisma-connection.repository'
import { PrismaBlockRepository } from './infrastructure/persistence/prisma/repositories/prisma-block.repository'

import { CreatePostUseCase } from './application/use-cases/create-post.use-case'
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case'
import { DeletePostUseCase } from './application/use-cases/delete-post.use-case'
import { GetFeedUseCase } from './application/use-cases/get-feed.use-case'
import { GetPostsByUserUseCase } from './application/use-cases/get-posts-by-user.use-case'
import { GetPostByIdUseCase } from './application/use-cases/get-post-by-id.use-case'
import { ToggleLikeUseCase } from './application/use-cases/toggle-like.use-case'
import { CreateCommentUseCase } from './application/use-cases/create-comment.use-case'
import { UpdateCommentUseCase } from './application/use-cases/update-comment.use-case'
import { DeleteCommentUseCase } from './application/use-cases/delete-comment.use-case'

import { PostsController } from './presentation/controllers/posts.controller'
import { CommentsController } from './presentation/controllers/comments.controller'

@Module({
  imports: [UsersModule],
  controllers: [PostsController, CommentsController],
  providers: [
    { provide: PostRepository, useClass: PrismaPostRepository },
    { provide: CommentRepository, useClass: PrismaCommentRepository },
    { provide: LikeRepository, useClass: PrismaLikeRepository },
    { provide: MediaRepository, useClass: PrismaMediaRepository },
    { provide: ConnectionRepository, useClass: PrismaConnectionRepository },
    { provide: BlockRepository, useClass: PrismaBlockRepository },
    CreatePostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    GetFeedUseCase,
    GetPostsByUserUseCase,
    GetPostByIdUseCase,
    ToggleLikeUseCase,
    CreateCommentUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
  ],
  exports: [PostRepository, CommentRepository, LikeRepository, MediaRepository],
})
export class PostsModule {}
