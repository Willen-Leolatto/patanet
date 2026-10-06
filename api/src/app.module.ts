import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './database/prisma/prisma.module'
import { UsersModule } from './modules/users/users.module'
import { ConnectionsModule } from './modules/connections/connections.module'
import { AnimalsModule } from './modules/animals/animals.module'
import { PostsModule } from './modules/posts/posts.module'
import { AuthModule } from './modules/auth/auth.module'
import { BlocksModule } from './modules/blocks/blocks.module'
import { ReportsModule } from './modules/reports/reports.module'
import { SupportModule } from './modules/support/support.module'
import { EventsModule } from './modules/events/events.module'
import { VeterinariansModule } from './modules/veterinarians/veterinarians.module'
import { PetshopsModule } from './modules/petshops/petshops.module'
import { AdoptionsModule } from './modules/adoptions/adoptions.module'
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module'
import { SharedModule } from './shared/shared.module'
import { EnvModule } from './env/env.module'
import { envSchema } from './env/env'
import { AuthGuard } from './shared/presentation/guards/auth.guard'
import { TermsAcceptedGuard } from './shared/presentation/guards/terms-accepted.guard'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: env => envSchema.parse(env),
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    SharedModule,
    EnvModule,
    UsersModule,
    ConnectionsModule,
    AnimalsModule,
    PostsModule,
    AuthModule,
    BlocksModule,
    ReportsModule,
    SupportModule,
    EventsModule,
    VeterinariansModule,
    PetshopsModule,
    AdoptionsModule,
    MedicalRecordsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TermsAcceptedGuard,
    },
  ],
})
export class AppModule {}
