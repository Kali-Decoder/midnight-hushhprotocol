// Hushh data layer on Midnight. Every call reads or writes the two contracts
// (night_registry, hushh_vault) through the connected wallet; the only server
// call is the social attestation (/api/social/attest).

import {
  bytesToHex,
  commitmentHex,
  hexToBytes,
  normalizeName,
  type Attestation,
  type NameRecord,
  type OwnedTip,
  type PassportKeys,
} from "@hushh/sdk";

import type {NoteHistoryItem, NoteHistoryPage, PublicUser} from "@/shared";
import {fromTokenUnits} from "@/lib/tokens";
import {NIGHT_DECIMALS} from "@/lib/midnight/config";
import {
  getClients,
  getState,
  readVault,
  refreshProfile,
  resolveName,
  resolveSocialHandle,
} from "@/lib/midnight/store";
import {listSent, recordSent} from "@/lib/sentLog";

// ── Users ────────────────────────────────────────────────────────────────────

export function toPublicUser(r: NameRecord, wallet?: string): PublicUser {
  return {
    id: r.name,
    wallet: wallet ?? `0x${r.tipPk.toString(16).padStart(64, "0")}`,
    username: r.name,
    bulletPublicKey: `0x${bytesToHex(r.boxPk)}`,
    twitterUsername: r.social?.startsWith("x:") ? r.social.slice(2) : null,
    tipPk: r.tipPk.toString(),
  };
}

/**
 * Resolve "@alice" / "alice" / "alice.night": a linked X handle first, then a
 * .night name. Returns null when nobody owns it.
 */
export async function resolveUser(username: string): Promise<PublicUser | null> {
  const clean = username.trim().toLowerCase().replace(/^@/, "");
  if (!clean) return null;
  const bySocial = clean.endsWith(".night") ? null : await resolveSocialHandle(clean);
  const record = bySocial ?? (await resolveName(clean));
  return record ? toPublicUser(record) : null;
}

// ── Passport registration + social links ────────────────────────────────────

export async function registerName(name: string, keys: PassportKeys): Promise<{txId: string}> {
  const {registry} = await getClients();
  const r = await registry.register(normalizeName(name), keys);
  await refreshProfile();
  return r;
}

/** Ask the attester to sign "x:<handle> belongs to <name>.night". */
export async function requestAttestation(params: {
  name: string;
  privyAccessToken?: string;
  /** Only honoured by an attester running in dev mode (no Privy). */
  handle?: string;
}): Promise<Attestation> {
  // Send only what the attester needs. Never forward passport keys.
  const body: Record<string, string> = {name: params.name};
  if (params.privyAccessToken) body.privyAccessToken = params.privyAccessToken;
  if (params.handle) body.handle = params.handle;
  const res = await fetch("/api/social/attest", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Attestation & {error?: string};
  if (!res.ok) throw new Error(data.error || `attestation failed (${res.status})`);
  return data;
}

export async function linkTwitter(params: {
  name: string;
  keys: PassportKeys;
  privyAccessToken?: string;
  handle?: string;
}): Promise<{txId: string; handle: string}> {
  const attestation = await requestAttestation({
    name: params.name,
    privyAccessToken: params.privyAccessToken,
    handle: params.handle,
  });
  const {registry} = await getClients();
  const r = await registry.linkSocial(params.keys, attestation);
  await refreshProfile();
  return {txId: r.txId, handle: attestation.social.replace(/^x:/, "")};
}

export async function unlinkTwitter(name: string, keys: PassportKeys): Promise<{txId: string}> {
  const {registry} = await getClients();
  const r = await registry.unlinkSocial(name, keys);
  await refreshProfile();
  return r;
}

// ── Tips ─────────────────────────────────────────────────────────────────────

export interface SentResult {
  txId: string;
  commitment: string;
}

/** Pay a .night passport. The tip is bound to their key; only they can claim. */
export async function sendTip(to: PublicUser, units: bigint): Promise<SentResult> {
  if (!to.tipPk) throw new Error("Recipient has no tip key.");
  const {vault} = await getClients();
  const r = await vault.sendTip(units, {
    tipPk: BigInt(to.tipPk),
    boxPk: hexToBytes(to.bulletPublicKey),
  });
  const commitment = commitmentHex(r.commitment);
  recordSent({
    commitment,
    txId: r.txId,
    amount: fromTokenUnits(units, NIGHT_DECIMALS),
    toLabel: `@${to.username}`,
    kind: "passport",
  });
  return {txId: r.txId, commitment};
}

/** Pay anyone with a link: whoever opens it can claim. */
export async function sendLinkTip(
  units: bigint,
  toLabel: string,
  buildUrl: (linkSecret: string) => string,
): Promise<SentResult & {claimUrl: string}> {
  const {vault} = await getClients();
  const r = await vault.sendLink(units);
  const commitment = commitmentHex(r.commitment);
  const claimUrl = buildUrl(encodeLinkSecret(r.linkSecret));
  recordSent({
    commitment,
    txId: r.txId,
    amount: fromTokenUnits(units, NIGHT_DECIMALS),
    toLabel,
    kind: "link",
    claimUrl,
  });
  return {txId: r.txId, commitment, claimUrl};
}

export async function listInbox(keys: PassportKeys): Promise<OwnedTip[]> {
  const l = await readVault();
  if (!l) return [];
  const {scanInbox} = await import("@hushh/sdk");
  return scanInbox(l, keys).reverse();
}

/** Claim one of my tips to the connected wallet. */
export async function claimTip(tip: OwnedTip, keys: PassportKeys): Promise<{txId: string}> {
  const {vault} = await getClients();
  const w = getState().wallet;
  if (!w) throw new Error("Connect a wallet to receive the NIGHT.");
  return vault.claim(tip, keys.tipKey, w.addressBytes);
}

/** Find (and optionally claim) the tip behind a claim link. */
export async function findLinkTip(encodedSecret: string) {
  const {vault} = await getClients();
  return vault.linkTip(decodeLinkSecret(encodedSecret));
}

export async function claimLinkTip(encodedSecret: string): Promise<{txId: string; amount: bigint}> {
  const {vault} = await getClients();
  const w = getState().wallet;
  if (!w) throw new Error("Connect a wallet to receive the NIGHT.");
  const {tip, tipKey} = await vault.linkTip(decodeLinkSecret(encodedSecret));
  if (!tip) throw new Error("This link's tip was not found on-chain yet. Try again in a few seconds.");
  if (tip.claimed) throw new Error("This tip was already claimed.");
  const r = await vault.claim(tip, tipKey, w.addressBytes);
  return {txId: r.txId, amount: tip.amount};
}

export function encodeLinkSecret(secret: Uint8Array): string {
  return btoa(String.fromCharCode(...secret)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeLinkSecret(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (out.length !== 32) throw new Error("Invalid claim link.");
  return out;
}

// ── History ──────────────────────────────────────────────────────────────────

export async function listNoteHistory(opts: {
  direction: "sent" | "received";
  page?: number;
  limit?: number;
}): Promise<NoteHistoryPage> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 5;
  let items: NoteHistoryItem[] = [];

  if (opts.direction === "sent") {
    const l = await readVault();
    items = listSent().map((s) => {
      let claimed = false;
      try {
        const c = BigInt(`0x${s.commitment}`);
        claimed = !!l?.tips.member(c) && l.tips.lookup(c).claimed;
      } catch {
        // malformed local entry
      }
      return {
        id: s.commitment,
        direction: "sent" as const,
        commitment: s.commitment,
        claimed,
        depositTxHash: s.txId,
        amount: s.amount,
        tokenSymbol: "NIGHT",
        createdAt: new Date(s.createdAt),
        toUsername: s.toLabel.replace(/^@/, ""),
        counterpartyUsername: s.toLabel.replace(/^@/, ""),
      };
    });
  } else {
    const keys = getState().keys;
    if (keys) {
      items = (await listInbox(keys)).map((t) => ({
        id: commitmentHex(t.commitment),
        direction: "received" as const,
        commitment: commitmentHex(t.commitment),
        claimed: t.claimed,
        amount: fromTokenUnits(t.amount, NIGHT_DECIMALS),
        tokenSymbol: "NIGHT",
        createdAt: new Date(Number(t.index)),
        counterpartyUsername: "private sender",
      }));
    }
  }

  const total = items.length;
  return {
    items: items.slice((page - 1) * limit, page * limit),
    page,
    pageSize: limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    direction: opts.direction,
  };
}
