import { createTestHarness } from 'wrangler';
import { spawn } from 'node:child_process';
const options = { workers: [{ configPath: 'dist/server/wrangler.json' }] };
const server = createTestHarness(options);
let conflict;
try {
  const { url } = await server.listen();
  const child = spawn(
    process.execPath,
    [
      '--experimental-strip-types',
      'scripts/check-http.mjs',
      String(url),
      '--session-smoke',
    ],
    { windowsHide: true, stdio: ['ignore', 'inherit', 'inherit', 'ipc'] },
  );
  child.on('message', async (message) => {
    if (
      message?.type === 'inject-cloud-conflict' ||
      message?.type === 'verify-cloud-conflict'
    ) {
      try {
        const { DB } = await server.getWorker().getEnv();
        if (message.type === 'inject-cloud-conflict') {
          conflict = await DB.prepare(
            'SELECT owner,revision,world FROM shared_farms LIMIT 1',
          ).first();
          if (!conflict) throw Error('No checkpoint');
          conflict.revision += 100000;
          await DB.prepare('UPDATE shared_farms SET revision=? WHERE owner=?')
            .bind(conflict.revision, conflict.owner)
            .run();
        } else {
          const row = await DB.prepare(
            'SELECT revision,world FROM shared_farms WHERE owner=?',
          )
            .bind(conflict.owner)
            .first();
          if (
            row.revision !== conflict.revision ||
            row.world !== conflict.world
          )
            throw Error('External save overwritten');
        }
        child.send({ type: 'cloud-conflict-ok' });
      } catch {
        child.send({ type: 'cloud-conflict-failed' });
      }
    }
    if (message?.type === 'restart-room-runtime') {
      try {
        await server.update(options);
        child.send({ type: 'runtime-restarted' });
      } catch {
        child.send({ type: 'runtime-restart-failed' });
      }
    }
  });
  const code = await new Promise((resolve) => child.on('exit', resolve));
  if (code !== 0) {
    server.debug();
    process.exitCode = 1;
  }
} finally {
  await server.close();
}
