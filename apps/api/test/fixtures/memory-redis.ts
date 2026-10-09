export class MemoryRedis {
  private values = new Map<string, { value: string; expires?: number }>();
  async get(key: string) {
    const row = this.values.get(key);
    if (row?.expires && row.expires < Date.now()) {
      this.values.delete(key);
      return null;
    }
    return row?.value ?? null;
  }
  async set(key: string, value: string, _mode?: string, ttl?: number) {
    this.values.set(key, { value, expires: ttl ? Date.now() + ttl * 1000 : undefined });
    return 'OK';
  }
  async del(key: string) {
    return Number(this.values.delete(key));
  }
  async incr(key: string) {
    const value = Number(await this.get(key)) + 1;
    await this.set(key, String(value));
    return value;
  }
  async eval(
    _script: string,
    _keyCount: number,
    key: string,
    expected: string,
    next: string,
    ttl: number,
  ) {
    const row = this.values.get(key);
    // Compare and replace synchronously to model a single Redis Lua operation.
    if (!row || row.value !== expected || (row.expires && row.expires < Date.now())) return 0;
    this.values.set(key, { value: next, expires: Date.now() + ttl * 1000 });
    return 1;
  }
  async ping() {
    return 'PONG';
  }
}
