// Node-side compiled contracts, deployment file I/O and the attester secret.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CompiledContract } from '@midnight-ntwrk/compact-js';

import * as Vault from '../sdk/contracts/vault.js';
import * as Registry from '../sdk/contracts/registry.js';
import { makeRegistryWitnesses, makeVaultWitnesses, type Holder, type NoteSecret } from '../sdk/witnesses.js';
import { newAttesterSecret } from '../sdk/attestation.js';
import { registryZkPath, vaultZkPath } from './wallet.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const NETWORK = process.env.MIDNIGHT_NETWORK ?? 'local';
export const DEPLOYMENT_FILE = path.join(ROOT, 'deployments', `${NETWORK}.json`);
const ATTESTER_FILE = path.join(ROOT, '.secrets', `attester-${NETWORK}.json`);

export function compiledVault(secret: Holder<NoteSecret>) {
  return CompiledContract.make('hushh_vault', Vault.Contract as any).pipe(
    CompiledContract.withWitnesses(makeVaultWitnesses(secret) as any),
    CompiledContract.withCompiledFileAssets(vaultZkPath),
  );
}

export function compiledRegistry(secret: Holder<Uint8Array>) {
  return CompiledContract.make('night_registry', Registry.Contract as any).pipe(
    CompiledContract.withWitnesses(makeRegistryWitnesses(secret) as any),
    CompiledContract.withCompiledFileAssets(registryZkPath),
  );
}

export interface Deployment {
  network: string;
  networkId: string;
  vault: string;
  registry: string;
  attesterPk: { x: string; y: string };
  deployedAt: string;
}

export function readDeployment(): Deployment | null {
  return fs.existsSync(DEPLOYMENT_FILE) ? JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf-8')) : null;
}

export function writeDeployment(d: Deployment) {
  fs.mkdirSync(path.dirname(DEPLOYMENT_FILE), { recursive: true });
  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(d, null, 2) + '\n');
}

/** The attester's Jubjub secret: ATTESTER_SECRET env, else a local file (created once). */
export function attesterSecret(): bigint {
  if (process.env.ATTESTER_SECRET) return BigInt(process.env.ATTESTER_SECRET);
  if (fs.existsSync(ATTESTER_FILE)) return BigInt(JSON.parse(fs.readFileSync(ATTESTER_FILE, 'utf-8')).secret);
  const secret = newAttesterSecret();
  fs.mkdirSync(path.dirname(ATTESTER_FILE), { recursive: true });
  fs.writeFileSync(ATTESTER_FILE, JSON.stringify({ secret: secret.toString() }, null, 2) + '\n', { mode: 0o600 });
  console.log(`New attester key written to ${path.relative(ROOT, ATTESTER_FILE)} (keep it secret).`);
  return secret;
}
