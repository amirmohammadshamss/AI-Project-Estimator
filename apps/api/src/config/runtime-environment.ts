export const environmentDefaults = {
  webOrigin: 'http://localhost:3000',
  apiPort: 4000,
  redisUrl: 'redis://localhost:6379',
} as const;

export function runtimeEnvironment() {
  return {
    webOrigin: process.env.WEB_ORIGIN ?? environmentDefaults.webOrigin,
    port: process.env.PORT ? Number(process.env.PORT) : environmentDefaults.apiPort,
    redisUrl: process.env.REDIS_URL ?? environmentDefaults.redisUrl,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    secureCookies:
      process.env.COOKIE_SECURE === 'true' ||
      (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production'),
  };
}
