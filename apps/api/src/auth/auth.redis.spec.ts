import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { refreshTokenRedisKey } from './auth.constants';
const integration = process.env.REDIS_TEST_URL ? describe : describe.skip;
integration('Real Redis refresh-token rotation', () => {
  it('executes Lua atomically and rejects replay after logout', async () => {
    const redis = new Redis(process.env.REDIS_TEST_URL!, { maxRetriesPerRequest: 1 });
    const user = {
      id: randomUUID(),
      email: 'redis-test@example.com',
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const priorAccess = process.env.JWT_SECRET;
    const priorRefresh = process.env.JWT_REFRESH_SECRET;
    process.env.JWT_SECRET = 'integration-access-secret-not-for-production';
    process.env.JWT_REFRESH_SECRET = 'integration-refresh-secret-not-for-production';
    const service = new AuthService(
      { create: async () => user, findById: async () => user } as unknown as UsersService,
      new JwtService(),
      redis,
    );
    try {
      const initial = await service.register(user.email, 'test-password');
      const results = await Promise.allSettled([
        service.refresh(initial.refreshToken),
        service.refresh(initial.refreshToken),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const success = results.find((result) => result.status === 'fulfilled');
      if (success?.status !== 'fulfilled') throw new Error('Expected a successful rotation');
      await service.logout(user.id);
      await expect(service.refresh(success.value.refreshToken)).rejects.toThrow();
    } finally {
      await redis.del(refreshTokenRedisKey(user.id));
      await redis.quit();
      if (priorAccess === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = priorAccess;
      if (priorRefresh === undefined) delete process.env.JWT_REFRESH_SECRET;
      else process.env.JWT_REFRESH_SECRET = priorRefresh;
    }
  });
});
