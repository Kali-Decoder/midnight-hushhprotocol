// Hushh tips: creation, sealing to a recipient's X25519 key, and scanning the
// vault's on-chain inbox by trial decryption.
//
// Plaintext (48 bytes, sealed with nacl.box to 64 bytes):
//   [0..8)   magic "HUSHHv1\0"
//   [8..16)  amount, u64 little-endian (NIGHT base units, 1 NIGHT = 1e6)
//   [16..48) rho, 32-byte little-endian field element
// The owner key is not in the plaintext: the recipient already knows it is
// their own tipPk, and checks the on-chain commitment before trusting a tip.
// The on-chain amount (not the ciphertext's) is what the UI shows.

import nacl from 'tweetnacl';

import * as Vault from './contracts/vault.js';

const MAGIC = new TextEncoder().encode('HUSHHv1\0');

export interface SealedNote {
  epk: Uint8Array;
  nonce: Uint8Array;
  box: Uint8Array;
}

export interface NewTip {
  owner: bigint;
  rho: bigint;
  amount: bigint;
  commitment: bigint;
}

/** A tip this client can claim (or already claimed). */
export interface OwnedTip {
  index: bigint;
  commitment: bigint;
  rho: bigint;
  amount: bigint;
  claimed: boolean;
}

export function randomRho(): bigint {
  // 31 random bytes: always below the scalar field modulus.
  return readLe(nacl.randomBytes(31));
}

function u64le(v: bigint): Uint8Array {
  if (v < 0n || v >= 1n << 64n) throw new Error('amount out of u64 range');
  const out = new Uint8Array(8);
  let x = v;
  for (let i = 0; i < 8; i++) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

function fieldLe(v: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let x = v;
  for (let i = 0; i < 32; i++) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

function readLe(bytes: Uint8Array): bigint {
  let x = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) x = (x << 8n) | BigInt(bytes[i]);
  return x;
}

export function newTip(owner: bigint, amount: bigint): NewTip {
  if (amount <= 0n) throw new Error('amount must be positive');
  const rho = randomRho();
  return { owner, rho, amount, commitment: Vault.pureCircuits.note_commitment(owner, rho) };
}

export function sealTip(t: { rho: bigint; amount: bigint }, recipientBoxPk: Uint8Array): SealedNote {
  const plain = new Uint8Array(48);
  plain.set(MAGIC, 0);
  plain.set(u64le(t.amount), 8);
  plain.set(fieldLe(t.rho), 16);
  const eph = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const box = nacl.box(plain, nonce, recipientBoxPk, eph.secretKey);
  return { epk: eph.publicKey, nonce, box };
}

export function openTip(
  ct: SealedNote,
  boxSecretKey: Uint8Array,
): { amount: bigint; rho: bigint } | null {
  const plain = nacl.box.open(ct.box, ct.nonce, ct.epk, boxSecretKey);
  if (!plain || plain.length !== 48) return null;
  for (let i = 0; i < MAGIC.length; i++) if (plain[i] !== MAGIC[i]) return null;
  return { amount: readLe(plain.subarray(8, 16)), rho: readLe(plain.subarray(16, 48)) };
}

/**
 * Scan the vault ledger for tips addressed to this key pair. A tip counts
 * only if it decrypts AND its recomputed commitment matches the on-chain one,
 * so a forged ciphertext cannot fake a payment.
 */
export function scanInbox(
  ledger: Vault.Ledger,
  keys: { tipPk: bigint; boxSecretKey: Uint8Array },
): OwnedTip[] {
  const out: OwnedTip[] = [];
  for (const [index, entry] of ledger.inbox) {
    const opened = openTip(entry.ct, keys.boxSecretKey);
    if (!opened) continue;
    const commitment = Vault.pureCircuits.note_commitment(keys.tipPk, opened.rho);
    if (commitment !== entry.commitment || !ledger.tips.member(commitment)) continue;
    const tip = ledger.tips.lookup(commitment);
    out.push({ index, commitment, rho: opened.rho, amount: tip.amount, claimed: tip.claimed });
  }
  return out.sort((a, b) => (a.index < b.index ? -1 : 1));
}

export function pendingTotal(tips: OwnedTip[]): bigint {
  return tips.filter((t) => !t.claimed).reduce((s, t) => s + t.amount, 0n);
}

export function commitmentHex(c: bigint): string {
  return Array.from(fieldLe(c).reverse())
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
