// Start / stop the local Midnight devnet (node + indexer + proof server).
// Usage: node scripts/localnet.mjs up|down|reset
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const cmd = process.argv[2] ?? 'up';
const envFile = 'infra/.env';
if (!existsSync(envFile)) {
  const tpl = readFileSync('.env.example', 'utf-8');
  writeFileSync(envFile, tpl.replace(/^APP__INFRA__SECRET=$/m, `APP__INFRA__SECRET=${randomBytes(32).toString('hex')}`));
  console.log('infra/.env created');
}
const files = ['-f infra/docker-compose.yml'];
if (process.platform === 'darwin') files.push('-f infra/docker-compose.macos.yml');
const compose = `docker compose ${files.join(' ')}`;
const run = (c) => execSync(c, { stdio: 'inherit' });

async function blockHeight() {
  try {
    const r = await fetch('http://localhost:9944', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'chain_getHeader' }),
    });
    return parseInt((await r.json()).result.number, 16);
  } catch {
    return -1;
  }
}

if (cmd === 'up') {
  // The indexer exits if it starts before the node has produced block 1, so
  // bring the node up first and wait for a couple of blocks.
  run(`${compose} up -d --wait node proof-server`);
  for (let i = 0; i < 60 && (await blockHeight()) < 2; i++) await new Promise((r) => setTimeout(r, 2000));
  run(`${compose} up -d --wait`);
}
else if (cmd === 'down') run(`${compose} down`);
else if (cmd === 'reset') run(`${compose} down -v`);
else throw new Error(`unknown command ${cmd}`);
