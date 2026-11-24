// App-wide Midnight state: the connected wallet, the unlocked passport keys,
// the passport's .night record, and the two contract clients.
//
// A tiny external store (subscribe/getSnapshot) so any component can read it
// with useSyncExternalStore, and so non-React modules (lib/api.ts) can use the
// same clients.

import {
  RegistryClient,
  VaultClient,
  deriveKeys,
  holder,
  lookupName,
  lookupSocial,
  lookupEmail,
  RegistryContract,
  VaultContract,
  type NameRecord,
  type NoteSecret,
  type PassportKeys,
} from "@hushh/sdk";
import {CompiledContract} from "@midnight-ntwrk/compact-js";
import {ContractState} from "@midnight-ntwrk/compact-runtime";
import {indexerPublicDataProvider} from "@midnightntwrk/midnight-js-indexer-public-data-provider";
import {makeRegistryWitnesses, makeVaultWitnesses} from "@hushh/sdk";

import {
  NETWORK_ID,
  READ_INDEXER,
  READ_INDEXER_WS,
  REGISTRY_ADDRESS,
  VAULT_ADDRESS,
  ZK_PATHS,
  contractsConfigured,
} from "./config";
import {connectWallet, type WalletSession} from "./wallet";
import type {PasskeyRef} from "./passkey";

export type WalletStatus = "disconnected" | "connecting" | "connected";

export interface MidnightState {
  walletStatus: WalletStatus;
  wallet: WalletSession | null;
  walletError: string | null;
  /** Unlocked passport keys (memory only). */
  keys: PassportKeys | null;
  /** The .night record owned by the unlocked keys, if registered. */
  profile: NameRecord | null;
  /** Remembered passport (name + passkey ref) so the UI can offer "Sign in". */
  remembered: RememberedPassport | null;
  ready: boolean;
}

export interface RememberedPassport {
  name: string | null;
  passkey?: PasskeyRef;
  method: "passkey" | "passphrase";
}

const REMEMBER_KEY = "hushh.passport";
// Unlocked master secret, tab-scoped. Prototype trade-off: the app navigates
// with full page loads, and re-prompting the passkey on every page is
// unusable. sessionStorage dies with the tab and is cleared on lock/sign-out.
const SESSION_SECRET_KEY = "hushh.passport.session";
const AUTOCONNECT_KEY = "hushh.wallet.autoconnect";

let state: MidnightState = {
  walletStatus: "disconnected",
  wallet: null,
  walletError: null,
  keys: null,
  profile: null,
  remembered: null,
  ready: false,
};

const listeners = new Set<() => void>();

function set(patch: Partial<MidnightState>) {
  state = {...state, ...patch};
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getState(): MidnightState {
  return state;
}

const SERVER_STATE = state;
export function getServerState(): MidnightState {
  return SERVER_STATE;
}

// ── Remembered passport (no secrets) ─────────────────────────────────────────

function readRemembered(): RememberedPassport | null {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? (JSON.parse(raw) as RememberedPassport) : null;
  } catch {
    return null;
  }
}

export function remember(r: RememberedPassport | null) {
  if (r) localStorage.setItem(REMEMBER_KEY, JSON.stringify(r));
  else localStorage.removeItem(REMEMBER_KEY);
  set({remembered: r});
}

let booted = false;
export function boot() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  set({remembered: readRemembered(), ready: true});
  if (localStorage.getItem(AUTOCONNECT_KEY)) void connect().catch(() => undefined);
  const saved = sessionStorage.getItem(SESSION_SECRET_KEY);
  if (saved) {
    const bytes = Uint8Array.from(saved.match(/../g) ?? [], (h) => parseInt(h, 16));
    if (bytes.length === 32) void unlock(bytes).catch(() => sessionStorage.removeItem(SESSION_SECRET_KEY));
  }
}

// ── Wallet ───────────────────────────────────────────────────────────────────

let connecting: Promise<WalletSession> | null = null;

export async function connect(): Promise<WalletSession> {
  if (state.wallet) return state.wallet;
  if (connecting) return connecting;
  set({walletStatus: "connecting", walletError: null});
  connecting = connectWallet()
    .then((w) => {
      localStorage.setItem(AUTOCONNECT_KEY, w.kind);
      set({wallet: w, walletStatus: "connected"});
      return w;
    })
    .catch((e) => {
      set({walletStatus: "disconnected", walletError: String((e as Error)?.message ?? e)});
      localStorage.removeItem(AUTOCONNECT_KEY);
      throw e;
    })
    .finally(() => {
      connecting = null;
    });
  return connecting;
}

export async function disconnect() {
  const w = state.wallet;
  localStorage.removeItem(AUTOCONNECT_KEY);
  clients = null;
  set({wallet: null, walletStatus: "disconnected"});
  await w?.disconnect().catch(() => undefined);
}

// ── Passport ─────────────────────────────────────────────────────────────────

/** Unlock with a master secret; looks up the name these keys own. */
export async function unlock(master: Uint8Array): Promise<{keys: PassportKeys; profile: NameRecord | null}> {
  const keys = deriveKeys(master);
  sessionStorage.setItem(SESSION_SECRET_KEY, Array.from(master, (b) => b.toString(16).padStart(2, "0")).join(""));
  const l = await readRegistry();
  const profile = l ? (await import("@hushh/sdk")).nameForOwner(l, keys.nameOwner) : null;
  set({keys, profile});
  return {keys, profile};
}

export function lock() {
  sessionStorage.removeItem(SESSION_SECRET_KEY);
  set({keys: null, profile: null});
}

export function setProfile(profile: NameRecord | null) {
  set({profile});
}

export async function refreshProfile(): Promise<NameRecord | null> {
  if (!state.keys) return null;
  const l = await readRegistry();
  const profile = l ? (await import("@hushh/sdk")).nameForOwner(l, state.keys.nameOwner) : null;
  set({profile});
  return profile;
}

// ── Contract clients (need a wallet) ─────────────────────────────────────────

interface Clients {
  vault: VaultClient;
  registry: RegistryClient;
}

let clients: Promise<Clients> | null = null;
const vaultSecret = holder<NoteSecret>();
const nameSecret = holder<Uint8Array>();

// CompiledContract's generics are keyed to a concrete contract type; the SDK
// works with the loosely typed generated module, so go through `any` here.
const CC: any = CompiledContract;

function compiledVault() {
  return CC.make("hushh_vault", VaultContract.Contract as any).pipe(
    CC.withWitnesses(makeVaultWitnesses(vaultSecret) as any),
    CC.withCompiledFileAssets(ZK_PATHS.hushh_vault),
  );
}

function compiledRegistry() {
  return CC.make("night_registry", RegistryContract.Contract as any).pipe(
    CC.withWitnesses(makeRegistryWitnesses(nameSecret) as any),
    CC.withCompiledFileAssets(ZK_PATHS.night_registry),
  );
}

export function getClients(): Promise<Clients> {
  if (!contractsConfigured()) {
    return Promise.reject(
      new Error(`Hushh contracts are not deployed on ${NETWORK_ID}. Run \`npm run deploy\` in ./midnight.`),
    );
  }
  if (!clients) {
    clients = (async () => {
      const w = await connect();
      const [vault, registry] = await Promise.all([
        VaultClient.connect(await w.providers("hushh_vault"), compiledVault() as any, VAULT_ADDRESS, vaultSecret),
        RegistryClient.connect(
          await w.providers("night_registry"),
          compiledRegistry() as any,
          REGISTRY_ADDRESS,
          nameSecret,
        ),
      ]);
      return {vault, registry};
    })().catch((e) => {
      clients = null;
      throw e;
    });
  }
  return clients;
}

// ── Read-only ledger access (works before a wallet connects on localnet) ─────

async function publicData() {
  if (state.wallet) return (await state.wallet.providers("night_registry")).publicDataProvider;
  if (!READ_INDEXER) return null;
  return indexerPublicDataProvider({queryURL: READ_INDEXER, subscriptionURL: READ_INDEXER_WS});
}

async function readState(address: string) {
  const pdp = await publicData();
  if (!pdp || !address) return null;
  const read = await pdp.queryContractState(address);
  if (!read) return null;
  return (read.contractState as any).deserialize({v9: ContractState}).data;
}

export async function readRegistry(): Promise<RegistryContract.Ledger | null> {
  const s = await readState(REGISTRY_ADDRESS);
  return s ? RegistryContract.ledger(s) : null;
}

export async function readVault(): Promise<VaultContract.Ledger | null> {
  const s = await readState(VAULT_ADDRESS);
  return s ? VaultContract.ledger(s) : null;
}

export async function resolveName(name: string): Promise<NameRecord | null> {
  const l = await readRegistry();
  if (!l) return null;
  try {
    return lookupName(l, name);
  } catch {
    return null;
  }
}

export async function resolveEmailAddress(email: string): Promise<NameRecord | null> {
  const l = await readRegistry();
  if (!l) return null;
  try {
    return lookupEmail(l, email);
  } catch {
    return null;
  }
}

export async function resolveSocialHandle(handle: string): Promise<NameRecord | null> {
  const l = await readRegistry();
  if (!l) return null;
  try {
    return lookupSocial(l, `x:${handle.trim().toLowerCase().replace(/^@/, "")}`);
  } catch {
    return null;
  }
}

// ── One-time contract deployment (the /deploy page) ──────────────────────────

export interface DeployResult {
  networkId: string;
  registry: string;
  vault: string;
  deployer: string;
  attesterPk: {x: string; y: string};
}

/**
 * Deploy night_registry (with the attester public key) and hushh_vault from
 * the connected wallet. The wallet proves, balances, pays DUST and signs; no
 * key ever leaves it.
 */
export async function deployContracts(
  attesterPk: {x: string; y: string},
  onStep: (step: "registry" | "vault") => void,
): Promise<DeployResult> {
  const w = await connect();
  onStep("registry");
  const registry = await RegistryClient.deploy(
    await w.providers("night_registry"),
    compiledRegistry() as any,
    nameSecret,
    {x: BigInt(attesterPk.x), y: BigInt(attesterPk.y)},
  );
  onStep("vault");
  const vault = await VaultClient.deploy(await w.providers("hushh_vault"), compiledVault() as any, vaultSecret);
  return {networkId: w.networkId, registry: registry.address, vault: vault.address, deployer: w.address, attesterPk};
}
