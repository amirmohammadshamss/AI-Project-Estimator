import { validateEnvironment } from './environment';
const valid = {
  DATABASE_URL: 'postgresql://localhost/test',
  REDIS_URL: 'redis://localhost',
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};
describe('Environment validation', () => {
  it('allows AI to be disabled and supplies defaults', () => {
    expect(validateEnvironment(valid).PORT).toBe(4000);
  });
  it('rejects short or identical signing secrets without revealing values', () => {
    expect(() => validateEnvironment({ ...valid, JWT_SECRET: 'short' })).toThrow('JWT_SECRET');
    expect(() => validateEnvironment({ ...valid, JWT_REFRESH_SECRET: valid.JWT_SECRET })).toThrow(
      'JWT_REFRESH_SECRET',
    );
  });
  it('rejects invalid connection protocols and cookie flags', () => {
    expect(() =>
      validateEnvironment({ ...valid, REDIS_URL: 'http://localhost', COOKIE_SECURE: 'yes' }),
    ).toThrow();
  });
});
