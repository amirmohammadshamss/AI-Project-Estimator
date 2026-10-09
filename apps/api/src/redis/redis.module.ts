import { serverConstants } from '../config/server.constants';
import { runtimeEnvironment } from '../config/runtime-environment';
import { Global, Module, Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';
export { REDIS_CLIENT } from './redis.constants';

@Injectable()
class RedisLifecycle implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}
  onModuleDestroy() {
    if (typeof this.client.disconnect === 'function') this.client.disconnect();
  }
}
@Global()
@Module({
  providers: [
    RedisLifecycle,
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis(runtimeEnvironment().redisUrl, {
          commandTimeout: serverConstants.redisCommandTimeoutMs,
          maxRetriesPerRequest: serverConstants.redisMaxRetries,
        }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
