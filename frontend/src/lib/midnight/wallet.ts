// Wallet backends behind one interface.
//
//   connector  1AM / Lace through the Midnight DApp Connector (preview, preprod,
//              mainnet). The wallet balances, proves and submits; it pays DUST.
//   dev        Localnet only: the genesis-funded wallet runs inside the page
//              (Wallet SDK) and pays every fee, like the Midnight Passport demo.
//              Every user on the page shares its NIGHT. Never use beyond localnet.

import type {MidnightProviders} from "@midnightntwrk/midnight-js-types";
import {FetchZkConfigProvider} from "@midnightntwrk/midnight-js-fetch-zk-config-provider";
import {indexerPublicDataProvider} from "@midnightntwrk/midnight-js-indexer-public-data-provider";
import {MidnightBech32m, UnshieldedAddress} from "@midnightntwrk/wallet-sdk-address-format";
import {unshieldedToken} from "@midnightntwrk/ledger-v9";

import {
  LOCAL_ENDPOINTS,
  NETWORK_ID,
  WALLET_MODE,
  ZK_PATHS,
  type ContractName,
} from "./config";

export interface WalletSession {
  kind: "connector" | "dev";
  /** Display name of the wallet (sanitised by rendering as text). */
  walletName: string;
  networkId: string;
  /** Bech32m unshielded address (mn_addr…). */
  address: string;
  /** 32-byte UserAddress, where claimed tips are paid. */
  addressBytes: Uint8Array;
  providers(contract: ContractName): Promise<MidnightProviders>;
  nightBalance(): Promise<bigint>;
  dustBalance(): Promise<bigint>;
  disconnect(): Promise<void>;
}

const NIGHT = unshieldedToken().raw;

function origin(): string {
  return window.location.origin;
}

function zkConfig(contract: ContractName) {
  return new FetchZkConfigProvider<string>(new URL(ZK_PATHS[contract], origin()).toString(), {
    fetchFunc: window.fetch.bind(window),
  });
}

/** In-memory private state. Hushh keeps no secrets in private state: every
 *  witness secret is loaded for a single call (see sdk/witnesses.ts). */
function memoryPrivateState(): any {
  const states = new Map<string, Map<string, unknown>>();
  const keys = new Map<string, unknown>();
  const scoped = (a: string) => {
    let m = states.get(a);
    if (!m) states.set(a, (m = new Map()));
    return m;
  };
  const unsupported = async (): Promise<never> => {
    throw new Error("not supported");
  };
  return {
    forContract(address: string) {
      const m = scoped(address);
      return {
        get: async (id: string) => (m.has(id) ? m.get(id) : null),
        set: async (id: string, s: unknown) => void m.set(id, s),
        remove: async (id: string) => void m.delete(id),
        clear: async () => m.clear(),
      };
    },
    clearAll: async () => states.clear(),
    setSigningKey: async (a: string, k: unknown) => void keys.set(a, k),
    getSigningKey: async (a: string) => keys.get(a) ?? null,
    removeSigningKey: async (a: string) => void keys.delete(a),
    clearSigningKeys: async () => keys.clear(),
    exportPrivateStates: unsupported,
    importPrivateStates: unsupported,
    exportSigningKeys: unsupported,
    importSigningKeys: unsupported,
  };
}

export function decodeUserAddress(bech32: string, networkId: string): Uint8Array {
  return MidnightBech32m.parse(bech32).decode(UnshieldedAddress, networkId).data;
}

// ── Connector (1AM / Lace) ───────────────────────────────────────────────────

type InitialAPI = import("@midnightntwrk/dapp-connector-api").InitialAPI;

export function detectWallets(): InitialAPI[] {
  if (typeof window === "undefined") return [];
  const m = (window as unknown as {midnight?: Record<string, InitialAPI>}).midnight ?? {};
  const list = Object.values(m).filter((w) => w && typeof w.connect === "function");
  // Prefer 1AM when several are installed.
  return list.sort((a, b) => (a === m["1am"] ? -1 : b === m["1am"] ? 1 : 0));
}

function validUrl(raw: unknown, schemes: string[]): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const u = new URL(raw);
    return schemes.includes(u.protocol) && u.host ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Network id + indexer endpoints from the wallet. Unlike midnight-js'
 * dappConnectorNetwork this does not require substrateNodeUri: the wallet
 * submits transactions itself, so the dApp never talks to the node (1AM can
 * report an empty node URI). NEXT_PUBLIC_MIDNIGHT_INDEXER_URL / _WS_URL
 * override or fill in the indexer. Errors name fields, never values (URLs can
 * carry API tokens).
 */
async function connectorNetwork(api: {getConfiguration(): Promise<any>}) {
  const cfg = await api.getConfiguration();
  const networkId = String(cfg?.networkId ?? "").trim();
  if (!networkId) throw new Error("The wallet did not report a network id.");
  const queryURL =
    validUrl(process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL, ["http:", "https:"]) ??
    validUrl(cfg?.indexerUri, ["http:", "https:"]);
  const subscriptionURL =
    validUrl(process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_WS_URL, ["ws:", "wss:"]) ??
    validUrl(cfg?.indexerWsUri, ["ws:", "wss:"]);
  if (!queryURL || !subscriptionURL) {
    throw new Error(
      "The wallet did not report a usable indexer (indexerUri / indexerWsUri). Set NEXT_PUBLIC_MIDNIGHT_INDEXER_URL and NEXT_PUBLIC_MIDNIGHT_INDEXER_WS_URL.",
    );
  }
  return {networkId, indexer: {queryURL, subscriptionURL}};
}

/** ws(s) relay URL of the configured node, keeping its query (Blockfrost project_id). */
function nodeRelayUrl(): URL | null {
  const raw = validUrl(LOCAL_ENDPOINTS.node, ["http:", "https:", "ws:", "wss:"]);
  if (!raw || (NETWORK_ID === "undeployed" && !process.env.NEXT_PUBLIC_MIDNIGHT_NODE_URL)) return null;
  const u = new URL(raw);
  u.protocol = u.protocol === "https:" || u.protocol === "wss:" ? "wss:" : "ws:";
  return u;
}

/** A MidnightProvider that submits finalized transactions to the node directly. */
async function nodeSubmitProvider() {
  const relayURL = nodeRelayUrl();
  if (!relayURL) return null;
  const [{createLedger9MidnightProvider}, {makeDefaultSubmissionService}, {Transaction}] = await Promise.all([
    import("@midnightntwrk/midnight-js-types"),
    import("@midnightntwrk/wallet-sdk-capabilities/submission"),
    import("@midnightntwrk/ledger-v9"),
  ]);
  return createLedger9MidnightProvider(async (handle: any) => {
    const tx = handle.deserialize({v9: Transaction});
    const [txId] = tx.identifiers();
    if (!txId) throw new Error("Refusing to submit a transaction without an identifier.");
    const submission = makeDefaultSubmissionService({relayURL});
    try {
      await submission.submitTransaction(tx, "InBlock");
    } finally {
      await submission.close().catch(() => undefined);
    }
    return txId;
  });
}

async function connectConnector(): Promise<WalletSession> {
  const [w] = detectWallets();
  if (!w) {
    throw new Error("No Midnight wallet found. Install 1AM or Lace and reload.");
  }
  const api = await w.connect(NETWORK_ID);
  const [{dappConnectorProofProvider, dappConnectorWalletProviders}, {CostModel}] = await Promise.all([
    import("@midnightntwrk/midnight-js-dapp-connector-proof-provider"),
    import("@midnightntwrk/ledger-v9"),
  ]);
  const network = await connectorNetwork(api);
  const {unshieldedAddress} = await api.getUnshieldedAddress();
  const {walletProvider, midnightProvider: walletSubmit} = await dappConnectorWalletProviders(api);
  // The wallet proves, balances and signs. Submission goes straight to the
  // configured node when there is one: 1AM can be left without a node
  // endpoint, and then its own submitTransaction fails with
  // "WebSocket connection failed".
  const midnightProvider = (await nodeSubmitProvider()) ?? walletSubmit;
  const publicDataProvider = indexerPublicDataProvider(network.indexer);
  const privateStateProvider = memoryPrivateState();
  const cache = new Map<ContractName, Promise<MidnightProviders>>();

  return {
    kind: "connector",
    walletName: w.name || "Midnight wallet",
    networkId: network.networkId,
    address: unshieldedAddress,
    addressBytes: decodeUserAddress(unshieldedAddress, network.networkId),
    providers(contract) {
      if (!cache.has(contract)) {
        cache.set(
          contract,
          (async () => {
            const zkConfigProvider = zkConfig(contract);
            return {
              privateStateProvider,
              publicDataProvider,
              zkConfigProvider,
              proofProvider: await dappConnectorProofProvider(api, zkConfigProvider, CostModel.initialCostModel()),
              walletProvider,
              midnightProvider,
              config: {networkId: network.networkId, ttlSeconds: 3600},
            } as unknown as MidnightProviders;
          })(),
        );
      }
      return cache.get(contract)!;
    },
    async nightBalance() {
      const b = await api.getUnshieldedBalances();
      return b[NIGHT] ?? 0n;
    },
    async dustBalance() {
      return (await api.getDustBalance()).balance;
    },
    async disconnect() {
      // The connector has no disconnect call; forgetting the session is enough.
    },
  };
}

// ── Dev wallet (localnet genesis seed) ───────────────────────────────────────

const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";

async function connectDevWallet(): Promise<WalletSession> {
  if (NETWORK_ID !== "undeployed") throw new Error("The dev wallet only runs on a localnet.");
  const [
    Rx,
    {httpClientProofProvider},
    {createLedger9MidnightProvider, createLedger9WalletProvider},
    {InMemoryTransactionHistoryStorage},
    {WalletFacade, WalletEntrySchema},
    {DustWallet},
    {WalletSeeds},
    {ShieldedWallet},
    {createKeystore, PublicKey, UnshieldedWallet},
  ] = await Promise.all([
    import("rxjs"),
    import("@midnightntwrk/midnight-js-http-client-proof-provider"),
    import("@midnightntwrk/midnight-js-types"),
    import("@midnightntwrk/wallet-sdk-abstractions"),
    import("@midnightntwrk/wallet-sdk-facade"),
    import("@midnightntwrk/wallet-sdk-dust-wallet"),
    import("@midnightntwrk/wallet-sdk-hd"),
    import("@midnightntwrk/wallet-sdk-shielded"),
    import("@midnightntwrk/wallet-sdk-unshielded-wallet"),
  ]);

  const seedBytes = Uint8Array.from(GENESIS_SEED.match(/../g)!.map((h) => parseInt(h, 16)));
  const seeds = WalletSeeds.fromMasterSeed(seedBytes);
  const networkId = NETWORK_ID;
  const keystore = createKeystore({kind: "schnorr", secret: seeds.unshielded}, networkId);

  const wallet = await WalletFacade.init({
    configuration: {
      networkId,
      indexerClientConnection: {
        indexerHttpUrl: LOCAL_ENDPOINTS.indexer,
        indexerWsUrl: LOCAL_ENDPOINTS.indexerWS,
      },
      provers: {v9: {kind: "server", url: new URL(LOCAL_ENDPOINTS.proofServer)}},
      relayURL: new URL(LOCAL_ENDPOINTS.node.replace(/^http/, "ws")),
      costParameters: {feeBlocksMargin: 100},
      txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema),
    } as any,
    shielded: (config: any) => ShieldedWallet(config).startWithSeed(seeds.shielded),
    unshielded: (config: any) =>
      UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(keystore)),
    dust: (config: any) => DustWallet(config).startWithSeed(seeds.dust),
  } as any);
  await wallet.start(seeds);

  const synced = () =>
    Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s: any) => s.isSynced === true))) as Promise<any>;
  const state = await synced();

  const signSegment = (payload: Uint8Array) => Promise.resolve(keystore.signData(payload));
  const walletProvider = createLedger9WalletProvider({
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await wallet.balanceUnboundTransaction(wallet.adoptTransaction(tx.serialize(), "Unbound"), {
        ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000),
      });
      return wallet.finalizeRecipe(await wallet.signRecipe(recipe, signSegment));
    },
  } as any);
  const midnightProvider = createLedger9MidnightProvider((tx: any) =>
    wallet.submitTransaction(wallet.adoptTransaction(tx.serialize(), "Finalized")),
  );
  const publicDataProvider = indexerPublicDataProvider({
    queryURL: LOCAL_ENDPOINTS.indexer,
    subscriptionURL: LOCAL_ENDPOINTS.indexerWS,
  });
  const privateStateProvider = memoryPrivateState();
  const address = (keystore as any).getBech32Address().asString() as string;

  return {
    kind: "dev",
    walletName: "Localnet dev wallet",
    networkId,
    address,
    addressBytes: decodeUserAddress(address, networkId),
    async providers(contract) {
      const zkConfigProvider = zkConfig(contract);
      return {
        privateStateProvider,
        publicDataProvider,
        zkConfigProvider,
        proofProvider: httpClientProofProvider({url: LOCAL_ENDPOINTS.proofServer, zkConfigProvider} as any),
        walletProvider,
        midnightProvider,
        config: {networkId, ttlSeconds: 30 * 60},
      } as unknown as MidnightProviders;
    },
    async nightBalance() {
      const s = await synced();
      return (s.unshielded.balances as Record<string, bigint>)[NIGHT] ?? 0n;
    },
    async dustBalance() {
      const s = await synced();
      return BigInt(s.dust.balance(new Date()));
    },
    async disconnect() {
      await wallet.stop();
    },
  };
}

export function connectWallet(): Promise<WalletSession> {
  return WALLET_MODE === "dev" ? connectDevWallet() : connectConnector();
}

export function walletAvailable(): boolean {
  return WALLET_MODE === "dev" || detectWallets().length > 0;
}
