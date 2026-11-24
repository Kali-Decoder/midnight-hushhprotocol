// Node-side provider and wallet plumbing (adapted from the Midnight Passport
// foundations demo). On localnet the genesis-seeded wallet pays DUST fees and
// supplies the NIGHT that tips are paid with.

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import { Buffer } from 'node:buffer';
import { MidnightBech32m, UnshieldedAddress } from '@midnightntwrk/wallet-sdk-address-format';
import { unshieldedToken } from '@midnightntwrk/ledger-v9';

import { httpClientProofProvider } from '@midnightntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnightntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnightntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnightntwrk/midnight-js-node-zk-config-provider';
import {
  createLedger9MidnightProvider,
  createLedger9WalletProvider,
  type MidnightProviders,
} from '@midnightntwrk/midnight-js-types';
import { InMemoryTransactionHistoryStorage } from '@midnightntwrk/wallet-sdk-abstractions';
import { WalletFacade, WalletEntrySchema } from '@midnightntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnightntwrk/wallet-sdk-dust-wallet';
import { WalletSeeds } from '@midnightntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnightntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  PublicKey,
  UnshieldedWallet,
} from '@midnightntwrk/wallet-sdk-unshielded-wallet';

// Ledger 9 / Wallet SDK 2.x: no setNetworkId (removed in Midnight.js 5), no
// ledger-v8 ZswapChainState.tryApply monkeypatch (that was a ledger-v8 bug),
// no hand-rolled tx-history stub (InMemoryTransactionHistoryStorage is back).

// Enable WebSocket for GraphQL subscriptions.
// @ts-expect-error required for wallet sync
globalThis.WebSocket = WebSocket;

const NETWORK = process.env.MIDNIGHT_NETWORK ?? 'local';

const CONFIGS: Record<
  string,
  { networkId: string; indexer: string; indexerWS: string; node: string; proofServer: string }
> = {
  local: {
    networkId: 'undeployed',
    indexer: 'http://localhost:8088/api/v4/graphql',
    indexerWS: 'ws://localhost:8088/api/v4/graphql/ws',
    node: 'http://localhost:9944',
    proofServer: 'http://127.0.0.1:6300',
  },
};

export const CONFIG = CONFIGS[NETWORK] ?? CONFIGS.local;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const managedPath = path.resolve(__dirname, '..', '..', 'contracts', 'managed');
export const vaultZkPath = path.join(managedPath, 'hushh_vault');
export const registryZkPath = path.join(managedPath, 'night_registry');

export async function createWallet(seed: string) {
  // WalletSeeds derives account 0 / index 0 for Zswap, NightExternal and Dust,
  // the same keys the localnet genesis seed is funded under.
  const seeds = WalletSeeds.fromMasterSeed(Buffer.from(seed, 'hex'));
  const networkId = CONFIG.networkId;
  const unshieldedKeystore = createKeystore({ kind: 'schnorr', secret: seeds.unshielded }, networkId);
  const feeBlocksMargin = Number(process.env.FEE_BLOCKS_MARGIN ?? '100');

  const wallet = await WalletFacade.init({
    configuration: {
      networkId,
      indexerClientConnection: {
        indexerHttpUrl: CONFIG.indexer,
        indexerWsUrl: CONFIG.indexerWS,
      },
      provingServerUrl: new URL(CONFIG.proofServer),
      relayURL: new URL(CONFIG.node.replace(/^http/, 'ws')),
      costParameters: { feeBlocksMargin },
      txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema),
    },
    shielded: (config) => ShieldedWallet(config).startWithSeed(seeds.shielded),
    unshielded: (config) =>
      UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (config) => DustWallet(config).startWithSeed(seeds.dust),
  });

  await wallet.start(seeds);

  return { wallet, seeds, unshieldedKeystore };
}

export type WalletContext = Awaited<ReturnType<typeof createWallet>>;

export async function syncWallet(walletCtx: WalletContext, label: string): Promise<void> {
  process.stdout.write(`Syncing ${label} to network`);
  await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap(() => process.stdout.write(' .')),
      Rx.filter((state) => state.isSynced === true),
    ),
  );
  console.log('\nWallet synced.');
}

export async function createProviders(
  walletCtx: WalletContext,
  contractZkPath: string,
): Promise<MidnightProviders> {
  const { wallet, unshieldedKeystore } = walletCtx;
  const state = await wallet.waitForSyncedState();
  const signSegment = (payload: Uint8Array) => Promise.resolve(unshieldedKeystore.signData(payload));

  // midnight-js hands transactions over as era-tagged handles; the facade
  // adopts the bytes at the protocol version it is acting at.
  const walletProvider = createLedger9WalletProvider({
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx, ttl) {
      const recipe = await wallet.balanceUnboundTransaction(wallet.adoptTransaction(tx.serialize(), 'Unbound'), {
        ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000),
      });
      return wallet.finalizeRecipe(await wallet.signRecipe(recipe, signSegment));
    },
  });
  const midnightProvider = createLedger9MidnightProvider((tx) =>
    wallet.submitTransaction(wallet.adoptTransaction(tx.serialize(), 'Finalized')),
  );

  const zkConfigProvider = new NodeZkConfigProvider<string>(contractZkPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      midnightDbName: `midnight-level-db`,
      privateStateStoreName: `hushh-${path.basename(contractZkPath)}`,
      privateStoragePasswordProvider: () => 'Hushh!Localnet-Demo-42',
      accountId: state.shielded.encryptionPublicKey.toHexString().slice(0, 16),
    }),
    publicDataProvider: indexerPublicDataProvider({ queryURL: CONFIG.indexer, subscriptionURL: CONFIG.indexerWS }),
    zkConfigProvider,
    proofProvider: httpClientProofProvider({ url: CONFIG.proofServer, zkConfigProvider }),
    walletProvider,
    midnightProvider,
    config: { networkId: CONFIG.networkId, ttlSeconds: 30 * 60 },
  };
}

// The wallet's 32-byte unshielded address, as the contract's UserAddress
// argument expects it. Decoded from the Bech32m address: the raw verifying
// key is NOT the address (an earlier helper used it and burned the funds).
export function userAddressBytes(walletCtx: WalletContext): Uint8Array {
  const bech32 = (walletCtx.unshieldedKeystore as any).getBech32Address().asString();
  return MidnightBech32m.parse(bech32).decode(UnshieldedAddress, CONFIG.networkId).data;
}

export async function nightBalance(walletCtx: WalletContext): Promise<bigint> {
  const state: any = await walletCtx.wallet.waitForSyncedState();
  const balances = state.unshielded.balances as Record<string, bigint>;
  return balances[unshieldedToken().raw] ?? 0n;
}

// The user's Zswap coin public key bytes, as ZswapCoinPublicKey expects.
export function coinPublicKeyBytes(state: any): Uint8Array {
  const cpk = state.shielded.coinPublicKey;
  const hex: string =
    typeof cpk?.toHexString === 'function' ? cpk.toHexString() : String(cpk?.bytes ?? cpk);
  const clean = hex.replace(/^0x/, '');
  const out = new Uint8Array(32);
  out.set(Buffer.from(clean, 'hex').subarray(0, 32));
  return out;
}
