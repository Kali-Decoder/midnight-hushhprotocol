// Encoding for .night names and social ids as the registry's Bytes<32> keys.

import { sha256 } from '@noble/hashes/sha2.js';

const MAX = 32;

/** "Alice.night" / "@alice" / " alice " -> "alice". Throws on invalid names. */
export function normalizeName(raw: string): string {
  const n = raw.trim().toLowerCase().replace(/^@/, '').replace(/\.night$/, '');
  if (!/^[a-z0-9][a-z0-9_-]{1,26}$/.test(n)) {
    throw new Error('names are 2-27 chars: a-z, 0-9, "-" or "_", starting with a letter or digit');
  }
  return n;
}

export function nameToBytes(name: string): Uint8Array {
  return fixed(normalizeName(name));
}

export function bytesToName(bytes: Uint8Array): string {
  return decodeFixed(bytes);
}

export type SocialProvider = 'x';

/** Social id stored on-chain, e.g. "x:alice". X handles are case-insensitive. */
export function socialId(provider: SocialProvider, handle: string): string {
  const h = handle.trim().toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9_]{1,15}$/.test(h)) throw new Error('invalid X handle');
  return `${provider}:${h}`;
}

export function socialToBytes(id: string): Uint8Array {
  return fixed(id);
}

export function bytesToSocial(bytes: Uint8Array): string | null {
  const s = decodeFixed(bytes);
  return s.length ? s : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** " Ada@Example.com " -> "ada@example.com". Throws on obviously invalid input. */
export function normalizeEmail(raw: string): string {
  const e = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(e) || e.length > 254) throw new Error('invalid email address');
  return e;
}

/**
 * On-chain key for an email link: SHA-256("hushh:email:v1:" + email).
 * Hides the address from casual readers of the chain; it cannot stop someone
 * who already knows (or guesses) an email from checking it, since senders
 * must be able to compute the same key from the address alone.
 */
export function emailHash(email: string): Uint8Array {
  return sha256(new TextEncoder().encode(`hushh:email:v1:${normalizeEmail(email)}`));
}

function fixed(s: string): Uint8Array {
  const b = new TextEncoder().encode(s);
  if (b.length > MAX) throw new Error(`"${s}" is longer than ${MAX} bytes`);
  const out = new Uint8Array(MAX);
  out.set(b);
  return out;
}

function decodeFixed(bytes: Uint8Array): string {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return new TextDecoder().decode(bytes.subarray(0, end));
}
