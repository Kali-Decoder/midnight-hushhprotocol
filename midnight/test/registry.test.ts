import { describe, it, expect, beforeEach } from 'vitest';

import { Simulator } from './simulator.js';
import * as Registry from '../src/sdk/contracts/registry.js';
import { deriveKeys } from '../src/sdk/keys.js';
import { nameToBytes, socialId, socialToBytes } from '../src/sdk/names.js';
import { attestationSig, attesterPublicKey, newAttesterSecret, signAttestation, verifyAttestation } from '../src/sdk/attestation.js';
import { lookupName, lookupSocial, nameForOwner } from '../src/sdk/client.js';
import { holder, makeRegistryWitnesses, withSecret } from '../src/sdk/witnesses.js';
import { randomBytes32 } from '../src/sdk/hex.js';

const ATTESTER = newAttesterSecret();
const alice = deriveKeys(randomBytes32());
const bob = deriveKeys(randomBytes32());
let secret: ReturnType<typeof holder<Uint8Array>>;
let sim: Simulator<Registry.Ledger>;

const as = (keys: { nameSecret: Uint8Array }, circuit: string, ...args: unknown[]) =>
  withSecret(secret, keys.nameSecret, () => sim.call(circuit, ...args));
const register = (keys: typeof alice, name: string) =>
  as(keys, 'register_name', nameToBytes(name), keys.tipPk, keys.boxPublicKey);
function link(keys: typeof alice, name: string, handle: string, signer = ATTESTER) {
  const a = signAttestation(signer, socialId('x', handle), name);
  return as(keys, 'link_social', nameToBytes(name), socialToBytes(a.social), attestationSig(a));
}

beforeEach(async () => {
  secret = holder<Uint8Array>();
  sim = await Simulator.create(Registry.Contract, makeRegistryWitnesses(secret), Registry.ledger, attesterPublicKey(ATTESTER));
});

describe('names', () => {
  it('registers a name with payment keys', async () => {
    await register(alice, 'alice');
    const r = lookupName(sim.ledger(), 'Alice.night')!;
    expect(r.tipPk).toBe(alice.tipPk);
    expect(Array.from(r.boxPk)).toEqual(Array.from(alice.boxPublicKey));
    expect(nameForOwner(sim.ledger(), alice.nameOwner)?.name).toBe('alice');
    expect(sim.ledger().name_count).toBe(1n);
  });

  it('is first come, first served', async () => {
    await register(alice, 'alice');
    await expect(register(bob, 'alice')).rejects.toThrow(/already taken/);
  });

  it('only the owner can rotate keys', async () => {
    await register(alice, 'alice');
    const fresh = deriveKeys(randomBytes32());
    await expect(
      as(bob, 'update_keys', nameToBytes('alice'), fresh.tipPk, fresh.boxPublicKey),
    ).rejects.toThrow(/not the name owner/);
    await as(alice, 'update_keys', nameToBytes('alice'), fresh.tipPk, fresh.boxPublicKey);
    expect(lookupName(sim.ledger(), 'alice')!.tipPk).toBe(fresh.tipPk);
  });
});

describe('social links', () => {
  beforeEach(async () => {
    await register(alice, 'alice');
    await register(bob, 'bob');
  });

  it('signs attestations the runtime verifier accepts', () => {
    const a = signAttestation(ATTESTER, socialId('x', 'alice_x'), 'alice');
    expect(verifyAttestation(attesterPublicKey(ATTESTER), a)).toBe(true);
    expect(verifyAttestation(attesterPublicKey(newAttesterSecret()), a)).toBe(false);
  });

  it('links an attested X handle and resolves it', async () => {
    await link(alice, 'alice', '@Alice_X');
    expect(lookupSocial(sim.ledger(), 'x:alice_x')?.name).toBe('alice');
    expect(lookupName(sim.ledger(), 'alice')!.social).toBe('x:alice_x');
  });

  it('rejects an attestation from an unknown signer', async () => {
    await expect(link(alice, 'alice', 'alice_x', newAttesterSecret())).rejects.toThrow(/bad attestation/);
  });

  it('rejects an attestation issued for a different name', async () => {
    const a = signAttestation(ATTESTER, socialId('x', 'alice_x'), 'bob');
    await expect(
      as(alice, 'link_social', nameToBytes('alice'), socialToBytes(a.social), attestationSig(a)),
    ).rejects.toThrow(/bad attestation/);
  });

  it('rejects linking a name you do not own', async () => {
    await expect(link(bob, 'alice', 'alice_x')).rejects.toThrow(/not the name owner/);
  });

  it('moves a handle to a new name and clears the old one', async () => {
    await link(alice, 'alice', 'shared');
    await link(bob, 'bob', 'shared');
    expect(lookupSocial(sim.ledger(), 'x:shared')?.name).toBe('bob');
    expect(lookupName(sim.ledger(), 'alice')!.social).toBeNull();
  });

  it('replaces and unlinks a name\'s own handle', async () => {
    await link(alice, 'alice', 'first');
    await link(alice, 'alice', 'second');
    expect(lookupSocial(sim.ledger(), 'x:first')).toBeNull();
    await as(alice, 'unlink_social', nameToBytes('alice'));
    expect(lookupSocial(sim.ledger(), 'x:second')).toBeNull();
    expect(lookupName(sim.ledger(), 'alice')!.social).toBeNull();
  });
});
