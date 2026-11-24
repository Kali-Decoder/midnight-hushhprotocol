// High-level clients over deployed Hushh contracts. Platform-neutral: the
// caller supplies midnight-js providers and a CompiledContract prepared for
// its platform (Node file assets or browser fetch assets).

import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { deployContract, findDeployedContract } from '@midnightntwrk/midnight-js-contracts';

import * as Vault from './contracts/vault.js';
import * as Registry from './contracts/registry.js';
import { newTip, sealTip, scanInbox, type OwnedTip } from './notes.js';
import { linkKeys, newLinkSecret, type PassportKeys } from './keys.js';
import { attestationSig, type Attestation } from './attestation.js';
import { bytesToName, bytesToSocial, nameToBytes, normalizeName, socialToBytes } from './names.js';
import { withSecret, type Holder, type NoteSecret } from './witnesses.js';
import { bytesToHex } from './hex.js';

export interface TxResult {
  txId: string;
}

function txResult(r: any): TxResult {
  const txId = r?.public?.txId ?? r?.public?.transactionHash;
  if (!txId) throw new Error('contract call returned without a transaction id');
  return { txId };
}

async function readState(providers: any, address: string) {
  // Midnight.js 5 returns era-tagged bytes; decode with our own compact-runtime copy.
  const read = await providers.publicDataProvider.queryContractState(address);
  if (!read) throw new Error(`no contract state at ${address}`);
  return read.contractState.deserialize({ v9: ContractState }).data;
}

async function deployOrFind(providers: any, compiledContract: any, id: string, address?: string, args: unknown[] = []) {
  if (address) {
    return (findDeployedContract as any)(providers, {
      contractAddress: address,
      compiledContract,
      privateStateId: id,
      initialPrivateState: {},
    });
  }
  return deployContract(providers, {
    compiledContract,
    privateStateId: id,
    initialPrivateState: {},
    args,
  } as any);
}

// ── Vault ────────────────────────────────────────────────────────────────────

export interface SentTip extends TxResult {
  commitment: bigint;
  amount: bigint;
}

export class VaultClient {
  private constructor(
    readonly address: string,
    private readonly providers: any,
    private readonly handle: any,
    private readonly secret: Holder<NoteSecret>,
  ) {}

  static async deploy(providers: any, compiled: any, secret: Holder<NoteSecret>) {
    const d = await deployOrFind(providers, compiled, 'hushh-vault');
    return new VaultClient(d.deployTxData.public.contractAddress, providers, d, secret);
  }

  static async connect(providers: any, compiled: any, address: string, secret: Holder<NoteSecret>) {
    const d = await deployOrFind(providers, compiled, 'hushh-vault', address);
    return new VaultClient(address, providers, d, secret);
  }

  async ledger(): Promise<Vault.Ledger> {
    return Vault.ledger(await readState(this.providers, this.address));
  }

  /** Pay a registered passport: the tip is bound to their tip key. */
  async sendTip(amount: bigint, to: { tipPk: bigint; boxPk: Uint8Array }): Promise<SentTip> {
    const tip = newTip(to.tipPk, amount);
    const ct = sealTip(tip, to.boxPk);
    const r = txResult(await this.handle.callTx.deposit(tip.commitment, amount, ct));
    return { ...r, commitment: tip.commitment, amount };
  }

  /** Pay anyone: whoever holds the returned link secret can claim. */
  async sendLink(amount: bigint): Promise<SentTip & { linkSecret: Uint8Array }> {
    const linkSecret = newLinkSecret();
    const k = linkKeys(linkSecret);
    const sent = await this.sendTip(amount, { tipPk: k.tipPk, boxPk: k.boxPublicKey });
    return { ...sent, linkSecret };
  }

  /** Claim a tip to a wallet's unshielded address (32 bytes). */
  claim(tip: { rho: bigint }, tipKey: Uint8Array, recipientAddress: Uint8Array): Promise<TxResult> {
    return withSecret(this.secret, { sk: tipKey, rho: tip.rho }, async () =>
      txResult(await this.handle.callTx.claim({ bytes: recipientAddress })),
    );
  }

  async inbox(keys: Pick<PassportKeys, 'tipPk' | 'boxSecretKey'>): Promise<OwnedTip[]> {
    return scanInbox(await this.ledger(), keys);
  }

  /** Find the tip behind a claim link. */
  async linkTip(linkSecret: Uint8Array): Promise<{ tip: OwnedTip | null; tipKey: Uint8Array }> {
    const k = linkKeys(linkSecret);
    const [tip] = scanInbox(await this.ledger(), { tipPk: k.tipPk, boxSecretKey: k.boxSecretKey });
    return { tip: tip ?? null, tipKey: k.tipKey };
  }
}

// ── Registry ─────────────────────────────────────────────────────────────────

export interface NameRecord {
  name: string;
  owner: bigint;
  tipPk: bigint;
  boxPk: Uint8Array;
  social: string | null;
  index: bigint;
}

function toRecord(name: Uint8Array, r: any): NameRecord {
  return {
    name: bytesToName(name),
    owner: r.owner,
    tipPk: r.tip_pk,
    boxPk: r.enc_pk,
    social: bytesToSocial(r.social),
    index: r.index,
  };
}

export class RegistryClient {
  private constructor(
    readonly address: string,
    private readonly providers: any,
    private readonly handle: any,
    private readonly secret: Holder<Uint8Array>,
  ) {}

  static async deploy(providers: any, compiled: any, secret: Holder<Uint8Array>, attesterPk: { x: bigint; y: bigint }) {
    const d = await deployOrFind(providers, compiled, 'night-registry', undefined, [attesterPk]);
    return new RegistryClient(d.deployTxData.public.contractAddress, providers, d, secret);
  }

  static async connect(providers: any, compiled: any, address: string, secret: Holder<Uint8Array>) {
    const d = await deployOrFind(providers, compiled, 'night-registry', address);
    return new RegistryClient(address, providers, d, secret);
  }

  async ledger(): Promise<Registry.Ledger> {
    return Registry.ledger(await readState(this.providers, this.address));
  }

  register(name: string, keys: PassportKeys): Promise<TxResult> {
    return withSecret(this.secret, keys.nameSecret, async () =>
      txResult(await this.handle.callTx.register_name(nameToBytes(name), keys.tipPk, keys.boxPublicKey)),
    );
  }

  updateKeys(name: string, keys: PassportKeys): Promise<TxResult> {
    return withSecret(this.secret, keys.nameSecret, async () =>
      txResult(await this.handle.callTx.update_keys(nameToBytes(name), keys.tipPk, keys.boxPublicKey)),
    );
  }

  linkSocial(keys: PassportKeys, a: Attestation): Promise<TxResult> {
    return withSecret(this.secret, keys.nameSecret, async () =>
      txResult(await this.handle.callTx.link_social(nameToBytes(a.name), socialToBytes(a.social), attestationSig(a))),
    );
  }

  unlinkSocial(name: string, keys: PassportKeys): Promise<TxResult> {
    return withSecret(this.secret, keys.nameSecret, async () =>
      txResult(await this.handle.callTx.unlink_social(nameToBytes(name))),
    );
  }

  async resolveName(name: string): Promise<NameRecord | null> {
    return lookupName(await this.ledger(), name);
  }

  async resolveSocial(id: string): Promise<NameRecord | null> {
    return lookupSocial(await this.ledger(), id);
  }

  /** The name owned by these keys, if any (used to restore a session). */
  async nameFor(keys: Pick<PassportKeys, 'nameOwner'>): Promise<NameRecord | null> {
    return nameForOwner(await this.ledger(), keys.nameOwner);
  }
}

export function lookupName(l: Registry.Ledger, name: string): NameRecord | null {
  const key = nameToBytes(normalizeName(name));
  return l.names.member(key) ? toRecord(key, l.names.lookup(key)) : null;
}

export function lookupSocial(l: Registry.Ledger, id: string): NameRecord | null {
  const key = socialToBytes(id);
  if (!l.socials.member(key)) return null;
  const name = l.socials.lookup(key);
  return l.names.member(name) ? toRecord(name, l.names.lookup(name)) : null;
}

export function nameForOwner(l: Registry.Ledger, owner: bigint): NameRecord | null {
  for (const [name, r] of l.names) if (r.owner === owner) return toRecord(name, r);
  return null;
}

export function allNames(l: Registry.Ledger): NameRecord[] {
  return [...l.names].map(([name, r]) => toRecord(name, r));
}

export { bytesToHex };
