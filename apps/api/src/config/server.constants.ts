export const serverConstants = {
  bodyLimit: '2mb',
  throttleTtlMs: 60000,
  throttleLimit: 100,
  redisCommandTimeoutMs: 2000,
  redisMaxRetries: 1,
} as const;
