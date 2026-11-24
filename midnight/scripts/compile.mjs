// Compile every Hushh contract with the pinned Ledger 9.1 toolchain.
// Usage: node scripts/compile.mjs [--skip-zk]
import { execFileSync } from 'node:child_process';

const COMPACT = '0.36.1';
const CONTRACTS = ['hushh_vault', 'night_registry'];
const extra = process.argv.includes('--skip-zk') ? ['--skip-zk'] : [];

for (const c of CONTRACTS) {
  console.log(`compiling ${c}${extra.length ? ' (skip-zk)' : ''}`);
  execFileSync('compact', ['compile', `+${COMPACT}`, ...extra, `contracts/${c}.compact`, `contracts/managed/${c}`], {
    stdio: 'inherit',
  });
}
