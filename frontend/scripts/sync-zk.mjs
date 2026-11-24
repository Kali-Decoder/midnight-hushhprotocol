// Copy compiled Midnight contract artifacts and deployment addresses from
// ../midnight into this app.
//   public/zk/<contract>/{compiler,keys,zkir}   proving assets (FetchZkConfigProvider)
//   src/lib/midnight/deployments.json            { <network>: { vault, registry, … } }
// Run automatically before `dev` and `build`.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..');
const midnight = join(app, '..', 'midnight');
const CONTRACTS = ['hushh_vault', 'night_registry'];

let missing = 0;
for (const c of CONTRACTS) {
  const src = join(midnight, 'contracts', 'managed', c);
  const dest = join(app, 'public', 'zk', c);
  if (!existsSync(join(src, 'keys'))) {
    console.warn(`[zk:sync] ${c}: no compiled keys in ${src}. Run \`npm run compile\` in ../midnight.`);
    missing++;
    continue;
  }
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const dir of ['compiler', 'keys', 'zkir']) cpSync(join(src, dir), join(dest, dir), { recursive: true });
  console.log(`[zk:sync] ${c} -> public/zk/${c}`);
}

const depDir = join(midnight, 'deployments');
const out = {};
if (existsSync(depDir)) {
  for (const f of readdirSync(depDir).filter((f) => f.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(join(depDir, f), 'utf-8'));
    out[d.networkId ?? f.replace(/\.json$/, '')] = d;
  }
}
writeFileSync(join(app, 'src', 'lib', 'midnight', 'deployments.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`[zk:sync] deployments: ${Object.keys(out).join(', ') || 'none'}`);
if (missing) console.warn('[zk:sync] some contracts are missing; the app will not be able to prove calls to them.');
