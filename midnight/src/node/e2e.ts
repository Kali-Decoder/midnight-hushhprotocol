// End-to-end check on a live network (localnet by default), with real proofs:
//   1. alice and bob register .night names (passport keys from random secrets)
//   2. bob links his X handle with an attester signature (verified in-circuit)
//   3. alice tips @bob_x  -> resolves to bob.night -> deposit to the vault
//   4. bob finds the tip by scanning the on-chain inbox, claims it once,
//      and a second claim is rejected
//   5. a claim-link tip is found and claimed from the link secret alone
// Usage: npm run deploy && npm run test:e2e
import * as Rx from 'rxjs';

import { deriveKeys } from '../sdk/keys.js';
import { socialId } from '../sdk/names.js';
import { signAttestation } from '../sdk/attestation.js';
import { RegistryClient, VaultClient } from '../sdk/client.js';
import { holder, type NoteSecret } from '../sdk/witnesses.js';
import { randomBytes32 } from '../sdk/hex.js';
import { attesterSecret, compiledRegistry, compiledVault, readDeployment } from './contracts.js';
import { createProviders, createWallet, nightBalance, registryZkPath, syncWallet, userAddressBytes, vaultZkPath } from './wallet.js';

const dep = readDeployment();
if (!dep) throw new Error('No deployment file. Run: npm run deploy');

const seed = process.env.WALLET_SEED ?? '0000000000000000000000000000000000000000000000000000000000000001';
const walletCtx = await createWallet(seed);
await syncWallet(walletCtx, 'funding wallet');

const regSecret = holder<Uint8Array>();
const registry = await RegistryClient.connect(
  await createProviders(walletCtx, registryZkPath), compiledRegistry(regSecret), dep.registry, regSecret);
const vaultSecret = holder<NoteSecret>();
const vault = await VaultClient.connect(
  await createProviders(walletCtx, vaultZkPath), compiledVault(vaultSecret), dep.vault, vaultSecret);

const step = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  const t0 = Date.now();
  process.stdout.write(`• ${label} … `);
  const r = await fn();
  console.log(`ok (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return r;
};
const check = (cond: unknown, msg: string) => { if (!cond) throw new Error(`CHECK FAILED: ${msg}`); };

async function waitFor<T>(fn: () => Promise<T | null>, ms = 90_000): Promise<T> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const v = await fn();
    if (v !== null) return v;
    await Rx.firstValueFrom(Rx.timer(2_000));
  }
  throw new Error('timed out waiting for wallet balance to change');
}

const run = Date.now().toString(36).slice(-5);
const alice = deriveKeys(randomBytes32());
const bob = deriveKeys(randomBytes32());
const aliceName = `alice-${run}`;
const bobName = `bob-${run}`;
const bobX = `bob_${run}`;

await step(`register ${aliceName}.night`, () => registry.register(aliceName, alice));
await step(`register ${bobName}.night`, () => registry.register(bobName, bob));
check((await registry.nameFor(bob))?.name === bobName, 'bob restores his name from his keys');

const att = signAttestation(attesterSecret(), socialId('x', bobX), bobName);
await step(`link @${bobX} -> ${bobName}.night (Jubjub attestation)`, () => registry.linkSocial(bob, att));

const to = await registry.resolveSocial(socialId('x', bobX));
check(to?.name === bobName, '@handle resolves to bob.night');

const AMOUNT = 2_500_000n; // 2.5 NIGHT
const sent = await step(`alice tips @${bobX} 2.5 NIGHT`, () => vault.sendTip(AMOUNT, { tipPk: to!.tipPk, boxPk: to!.boxPk }));

const inbox = await vault.inbox(bob);
const tip = inbox.find((t) => t.commitment === sent.commitment);
check(tip && tip.amount === AMOUNT && !tip.claimed, 'bob finds the tip in the on-chain inbox');
check((await vault.inbox(alice)).every((t) => t.commitment !== sent.commitment), 'alice cannot see bob\'s tip');

const wallet = userAddressBytes(walletCtx);
// Fees are paid in DUST, so the wallet's NIGHT should rise by exactly AMOUNT.
const before = await nightBalance(walletCtx);
await step('bob claims the tip to a wallet', () => vault.claim(tip!, bob.tipKey, wallet));
const after = await waitFor(async () => {
  const b = await nightBalance(walletCtx);
  return b !== before ? b : null;
});
check(after - before === AMOUNT, `wallet NIGHT rose by the tip (${before} -> ${after})`);
console.log(`• wallet NIGHT ${before} -> ${after} ok`);
check((await vault.inbox(bob)).find((t) => t.commitment === sent.commitment)?.claimed, 'tip marked claimed');

let rejected = false;
try { await vault.claim(tip!, bob.tipKey, wallet); } catch { rejected = true; }
check(rejected, 'second claim is rejected');
console.log('• second claim rejected ok');

const link = await step('send a 1 NIGHT claim link', () => vault.sendLink(1_000_000n));
const found = await vault.linkTip(link.linkSecret);
check(found.tip?.commitment === link.commitment, 'link tip found from the link secret alone');
await step('claim the link tip', () => vault.claim(found.tip!, found.tipKey, wallet));

const l = await vault.ledger();
console.log(`\nAll checks passed. vault tips=${l.tip_count} balance=${l.vault_balance}`);
await Rx.firstValueFrom(Rx.timer(500));
await walletCtx.wallet.stop();
process.exit(0);
