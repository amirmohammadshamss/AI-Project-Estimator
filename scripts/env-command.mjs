import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
dotenv.config();
const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error('An executable is required.');
const child = spawn(command, args, { stdio: 'inherit', env: process.env });
child.on('error', () => {
  console.error('Unable to start the requested command.');
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
