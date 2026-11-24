// Passport key derivation. One 32-byte master secret (the passkey PRF output,
// or a dev-mode passphrase digest) expands into three domain-separated keys:
//
//   tipKey      claims tips sent to this passport (vault witness `note_secret.sk`)
//   nameSecret  proves ownership of a .night name (registry witness)
//   box keypair X25519 key that tip ciphertexts are sealed to
//
// The master secret is never stored; it is re-derived on every sign-in.

import nacl from 'tweetnacl';
import { sha256 } from '@noble/hashes/sha2.js';

import * as Vault from './contracts/vault.js';
import * as Registry from './contracts/registry.js';

export interface PassportKeys {
  tipKey: Uint8Array;
  nameSecret: Uint8Array;
  boxPublicKey: Uint8Array;
  boxSecretKey: Uint8Array;
  /** Vault owner key (Field) that incoming tips are bound to. */
  tipPk: bigint;
  /** Registry owner key (Field) stored on the name record. */
  nameOwner: bigint;
}

function expand(master: Uint8Array, tag: string): Uint8Array {
  const t = new TextEncoder().encode(tag);
  const buf = new Uint8Array(t.length + master.length);
  buf.set(t);
  buf.set(master, t.length);
  return sha256(buf);
}

export function deriveKeys(master: Uint8Array): PassportKeys {
  if (master.length !== 32) throw new Error('master secret must be 32 bytes');
  const tipKey = expand(master, 'hushh:passport:tip:v1');
  const nameSecret = expand(master, 'hushh:passport:name:v1');
  const box = nacl.box.keyPair.fromSecretKey(expand(master, 'hushh:passport:x25519:v1'));
  return {
    tipKey,
    nameSecret,
    boxPublicKey: box.publicKey,
    boxSecretKey: box.secretKey,
    tipPk: Vault.pureCircuits.owner_key(tipKey),
    nameOwner: Registry.pureCircuits.name_owner_key(nameSecret),
  };
}

/**
 * Keys behind a claim link. The link carries only `linkSecret`; the tip key
 * and the box key (used to find the tip in the inbox) both derive from it.
 */
export function linkKeys(linkSecret: Uint8Array) {
  const tipKey = expand(linkSecret, 'hushh:link:tip:v1');
  const box = nacl.box.keyPair.fromSecretKey(expand(linkSecret, 'hushh:link:x25519:v1'));
  return {
    tipKey,
    tipPk: Vault.pureCircuits.owner_key(tipKey),
    boxPublicKey: box.publicKey,
    boxSecretKey: box.secretKey,
  };
}

export function newLinkSecret(): Uint8Array {
  return nacl.randomBytes(32);
}
