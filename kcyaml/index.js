#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const isBun = Boolean(process.versions.bun);

  if (!isBun && !process.env.KCYAML_NODE_ONLY) {
    try {
      const cmd = process.platform === 'win32' ? 'where bun' : 'which bun';
      execSync(cmd, { stdio: 'ignore' });
      const res = spawnSync('bun', [__filename, ...process.argv.slice(2)], {
        stdio: 'inherit',
        env: { ...process.env, KCYAML_NODE_ONLY: '1' },
      });
      if (res.status === 0) process.exit(0);
    } catch {}
  }

  const distPath = path.join(__dirname, 'dist', 'cli.js');
  if (!fs.existsSync(distPath)) {
    try {
      execSync('npx tsc', { cwd: __dirname, stdio: 'ignore' });
    } catch {}
  }

  const { runCli } = await import('./dist/cli.js');
  await runCli(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
