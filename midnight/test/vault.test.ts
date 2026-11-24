import { describe, it, expect, beforeEach } from 'vitest';

import { Simulator } from './simulator.js';
import * as Vault from '../src/sdk/contracts/vault.js';
import { deriveKeys, linkKeys, newLinkSecret } from '../src/sdk/keys.js';
import { newTip, sealTip, scanInbox, pendingTotal } from '../src/sdk/notes.js';
import { holder, makeVaultWitnesses, withSecret, type NoteSecret } from '../src/sdk/witnesses.js';
import { randomBytes32 } from '../src/sdk/hex.js';

const WALLET = { bytes: new Uint8Array(32).fill(0xaa) };

let secret: ReturnType<typeof holder<NoteSecret>>;
let sim: Simulator<Vault.Ledger>;
const alice = deriveKeys(randomBytes32());
const bob = deriveKeys(randomBytes32());

async function send(amount: bigint, to: { tipPk: bigint; boxPublicKey: Uint8Array }) {
  const t = newTip(to.tipPk, amount);
  await sim.call('deposit', t.commitment, amount, sealTip(t, to.boxPublicKey));
  return t;
}

function claimAs(sk: Uint8Array, rho: bigint) {
  return withSecret(secret, { sk, rho }, () => sim.call('claim', WALLET));
}

beforeEach(async () => {
  secret = holder<NoteSecret>();
  sim = await Simulator.create(Vault.Contract, makeVaultWitnesses(secret), Vault.ledger);
});

describe('deposit', () => {
  it('records the tip, inbox entry and vault balance', async () => {
    const t = await send(5_000_000n, bob);
    const l = sim.ledger();
    expect(l.tip_count).toBe(1n);
    expect(l.vault_balance).toBe(5_000_000n);
    expect(l.tips.lookup(t.commitment)).toEqual({ amount: 5_000_000n, claimed: false });
    expect(l.inbox.lookup(0n).commitment).toBe(t.commitment);
  });

  it('rejects zero amounts and reused commitments', async () => {
    const t = newTip(bob.tipPk, 1n);
    await expect(sim.call('deposit', t.commitment, 0n, sealTip(t, bob.boxPublicKey))).rejects.toThrow(/positive/);
    await sim.call('deposit', t.commitment, 1n, sealTip(t, bob.boxPublicKey));
    await expect(sim.call('deposit', t.commitment, 1n, sealTip(t, bob.boxPublicKey))).rejects.toThrow(/already used/);
  });
});

describe('inbox scanning', () => {
  it('finds only the tips sealed to me, with on-chain amounts', async () => {
    await send(1_000_000n, bob);
    await send(2_000_000n, alice);
    await send(3_000_000n, bob);
    const mine = scanInbox(sim.ledger(), bob);
    expect(mine.map((t) => t.amount)).toEqual([1_000_000n, 3_000_000n]);
    expect(pendingTotal(mine)).toBe(4_000_000n);
    expect(scanInbox(sim.ledger(), alice).map((t) => t.amount)).toEqual([2_000_000n]);
  });

  it('ignores a ciphertext whose commitment is not bound to my key', async () => {
    // Attacker seals a note to bob but commits it to their own key.
    const t = newTip(alice.tipPk, 9n);
    await sim.call('deposit', t.commitment, 9n, sealTip(t, bob.boxPublicKey));
    expect(scanInbox(sim.ledger(), bob)).toEqual([]);
  });
});

describe('claim', () => {
  it('pays out once and marks the tip claimed', async () => {
    const t = await send(7_000_000n, bob);
    const { effects } = await claimAs(bob.tipKey, t.rho);
    const l = sim.ledger();
    expect(l.tips.lookup(t.commitment).claimed).toBe(true);
    expect(l.vault_balance).toBe(0n);
    expect(effects).toBeDefined();
    expect(scanInbox(l, bob)[0].claimed).toBe(true);
  });

  it('rejects a second claim of the same tip', async () => {
    const t = await send(1n, bob);
    await claimAs(bob.tipKey, t.rho);
    await expect(claimAs(bob.tipKey, t.rho)).rejects.toThrow(/already claimed/);
  });

  it('rejects a claimer who does not know the note secret', async () => {
    const t = await send(1n, bob);
    // The sender knows rho but not bob's tip key.
    await expect(claimAs(alice.tipKey, t.rho)).rejects.toThrow(/unknown tip/);
    await expect(claimAs(bob.tipKey, t.rho + 1n)).rejects.toThrow(/unknown tip/);
  });

  it('rejects claiming with no secret loaded', async () => {
    await send(1n, bob);
    await expect(sim.call('claim', WALLET)).rejects.toThrow(/no secret is loaded/);
  });
});

describe('claim links', () => {
  it('lets whoever holds the link find and claim the tip', async () => {
    const link = newLinkSecret();
    const k = linkKeys(link);
    const t = await send(4_000_000n, { tipPk: k.tipPk, boxPublicKey: k.boxPublicKey });
    const [found] = scanInbox(sim.ledger(), k);
    expect(found.commitment).toBe(t.commitment);
    await claimAs(k.tipKey, found.rho);
    expect(sim.ledger().tips.lookup(t.commitment).claimed).toBe(true);
  });
});
