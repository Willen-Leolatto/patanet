import { Global, Module } from '@nestjs/common'
import { HashingPort } from './application/ports/hashing.port'
import { BcryptHashingAdapter } from './infrastructure/hashing/bcrypt-hashing.adapter'
import { StoragePort } from './application/ports/storage.port'
import { S3StorageAdapter } from './infrastructure/storage/s3-storage.adapter'
import { GoogleTokenVerifierPort } from './application/ports/google-token-verifier.port'
import { GoogleAuthLibraryVerifierAdapter } from './infrastructure/google/google-auth-library-verifier.adapter'
import { EnvModule } from '../env/env.module'

@Global()
@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: HashingPort,
      useClass: BcryptHashingAdapter,
    },
    {
      provide: StoragePort,
      useClass: S3StorageAdapter,
    },
    {
      provide: GoogleTokenVerifierPort,
      useClass: GoogleAuthLibraryVerifierAdapter,
    },
  ],
  exports: [HashingPort, StoragePort, GoogleTokenVerifierPort],
})
export class SharedModule {}
