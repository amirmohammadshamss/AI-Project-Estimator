import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.env')) console.log('Using existing .env.');
else {
  const template = readFileSync('.env.example', 'utf8')
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString('hex')}`)
    .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${randomBytes(32).toString('hex')}`);
  writeFileSync('.env', template, { flag: 'wx', mode: 0o600 });
  console.log('Created .env with random JWT secrets. Add an OpenAI key to enable AI generation.');
}
