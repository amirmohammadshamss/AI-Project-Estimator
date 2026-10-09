import { runSeed } from './seed';
runSeed(false).catch(() => {
  console.error(
    'Demo seed failed. Check database/Redis, migrations, JWT secrets and DEMO_PASSWORD.',
  );
  process.exitCode = 1;
});
