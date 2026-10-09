import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'dotenv';

// Report locations only; never print credential values or matching source lines.
const patterns = [
  /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  /AKIA[A-Z0-9]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const configured = existsSync('.env') ? parse(readFileSync('.env')) : {};
const secrets = ['OPENAI_API_KEY', 'JWT_SECRET', 'JWT_REFRESH_SECRET']
  .map((key) => configured[key])
  .filter((value) => value && value.length >= 20 && !value.startsWith('replace-'));
const matches = (text) =>
  patterns.some((pattern) => pattern.test(text)) || secrets.some((secret) => text.includes(secret));
const findings = [];
const objects = execFileSync('git', ['rev-list', '--objects', '--all'], { encoding: 'utf8' })
  .trim()
  .split('\n');
for (const object of objects) {
  const [hash, ...path] = object.split(' ');
  if (
    !path.length ||
    execFileSync('git', ['cat-file', '-t', hash], { encoding: 'utf8' }).trim() !== 'blob'
  )
    continue;
  const content = execFileSync('git', ['cat-file', 'blob', hash], { maxBuffer: 20 * 1024 * 1024 });
  if (matches(content.toString()))
    findings.push(`history: ${path.join(' ')} (${hash.slice(0, 8)})`);
}
for (const path of execFileSync('git', ['ls-files', '-co', '--exclude-standard'], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')) {
  if (path && existsSync(path) && matches(readFileSync(path, 'utf8')))
    findings.push(`working tree: ${path}`);
}
function inspectBundles(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) inspectBundles(path);
    else if (matches(readFileSync(path, 'utf8'))) findings.push(`browser bundle: ${path}`);
  }
}
inspectBundles('apps/web/.next/static');
if (findings.length) {
  console.error(`Potential credentials found:\n${[...new Set(findings)].join('\n')}`);
  process.exitCode = 1;
} else
  console.log(
    'Credential patterns and configured secrets absent from git history, working tree and available browser bundles.',
  );
