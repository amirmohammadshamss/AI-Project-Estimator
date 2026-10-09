import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { DashboardStats, DashboardStatsSchema } from '@ape/types';
import { REDIS_CLIENT } from '../redis/redis.module';
import { DASHBOARD_CACHE_TTL } from './dashboard.constants';
export { DASHBOARD_CACHE_TTL } from './dashboard.constants';
@Injectable()
export class DashboardCacheService {
  private readonly logger = new Logger(DashboardCacheService.name);
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
  private prefix(userId: string) {
    return `dashboard:v1:${createHash('sha256').update(userId).digest('hex')}`;
  }
  async revision(userId: string): Promise<string | undefined> {
    try {
      return (await this.redis.get(`${this.prefix(userId)}:revision`)) ?? '0';
    } catch {
      return undefined;
    }
  }
  async get(userId: string, revision: string | undefined): Promise<DashboardStats | undefined> {
    if (revision === undefined) return undefined;
    try {
      const raw = await this.redis.get(`${this.prefix(userId)}:${revision}`);
      if (!raw) return undefined;
      return DashboardStatsSchema.parse(JSON.parse(raw));
    } catch {
      return undefined;
    }
  }
  async set(userId: string, revision: string | undefined, stats: DashboardStats) {
    if (revision === undefined) return;
    try {
      await this.redis.set(
        `${this.prefix(userId)}:${revision}`,
        JSON.stringify(stats),
        'EX',
        DASHBOARD_CACHE_TTL,
      );
    } catch {
      this.logger.debug('Dashboard cache write unavailable.');
    }
  }
  async invalidate(userId: string) {
    // In-flight readers can only populate the old revision, which expires naturally.
    try {
      await this.redis.incr(`${this.prefix(userId)}:revision`);
    } catch {
      this.logger.debug('Dashboard cache invalidation unavailable.');
    }
  }
}
