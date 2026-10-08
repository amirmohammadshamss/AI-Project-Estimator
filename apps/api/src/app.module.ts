import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { EstimatesModule } from './estimates/estimates.module';
import { FeaturesModule } from './features/features.module';
import { AiModule } from './ai/ai.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { SearchModule } from './search/search.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    EstimatesModule,
    FeaturesModule,
    AiModule,
    EmbeddingsModule,
    SearchModule,
    ActivityModule,
  ],
})
export class AppModule {}
