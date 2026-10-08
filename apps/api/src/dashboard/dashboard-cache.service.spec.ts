import Redis from 'ioredis';
import { DashboardStats } from '@ape/types';
import { DashboardCacheService, DASHBOARD_CACHE_TTL } from './dashboard-cache.service';
const stats: DashboardStats = {
  totalProjects: 0,
  estimatedProjects: 0,
  totalEstimatedHours: '0',
  averageProjectSize: '0',
  averageConfidence: null,
  statusDistribution: [],
  hoursByProject: [],
  costOverTime: [],
  recentProjects: [],
};
describe('DashboardCacheService', () => {
  const values = new Map<string, string>();
  const redis = {
    get: jest.fn(async (key: string) => values.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
      return 'OK';
    }),
    incr: jest.fn(async (key: string) => {
      const next = Number(values.get(key) ?? 0) + 1;
      values.set(key, String(next));
      return next;
    }),
  };
  const cache = new DashboardCacheService(redis as unknown as Redis);
  beforeEach(() => {
    jest.clearAllMocks();
    values.clear();
  });
  it('caches per user with a short TTL and validates cached data', async () => {
    await cache.set('owner', '0', stats);
    expect(await cache.get('owner', '0')).toEqual(stats);
    expect(await cache.get('other', '0')).toBeUndefined();
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^dashboard:v1:[a-f0-9]{64}:0$/),
      JSON.stringify(stats),
      'EX',
      DASHBOARD_CACHE_TTL,
    );
    const key = redis.set.mock.calls[0]![0];
    values.set(key, '{}');
    expect(await cache.get('owner', '0')).toBeUndefined();
  });
  it('prevents an in-flight old snapshot from repopulating the current revision', async () => {
    const before = await cache.revision('owner');
    await cache.invalidate('owner');
    await cache.set('owner', before, stats);
    const after = await cache.revision('owner');
    expect(after).toBe('1');
    expect(await cache.get('owner', after)).toBeUndefined();
  });
  it('tolerates Redis outages without failing mutations', async () => {
    redis.get.mockRejectedValueOnce(new Error('offline'));
    expect(await cache.revision('owner')).toBeUndefined();
    redis.incr.mockRejectedValueOnce(new Error('offline'));
    await expect(cache.invalidate('owner')).resolves.toBeUndefined();
    redis.set.mockRejectedValueOnce(new Error('offline'));
    await expect(cache.set('owner', '0', stats)).resolves.toBeUndefined();
  });
});
