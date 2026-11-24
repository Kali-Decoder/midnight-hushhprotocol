// Network + deployment configuration for the Midnight build of Hushh.
//
//   NEXT_PUBLIC_MIDNIGHT_NETWORK   undeployed (localnet, default) | preview | preprod | mainnet
//   NEXT_PUBLIC_WALLET_MODE        connector (1AM / Lace) | dev (localnet genesis wallet in the page)
//   NEXT_PUBLIC_VAULT_ADDRESS      override the hushh_vault address
//   NEXT_PUBLIC_REGISTRY_ADDRESS   override the night_registry address
//   NEXT_PUBLIC_MIDNIGHT_INDEXER_URL / _WS_URL / _NODE_URL / _PROOF_SERVER_URL
//                                  localnet endpoints (connector mode reads them from the wallet)
//   NEXT_PUBLIC_EXPLORER_URL       optional block explorer base (…/tx/<hash>)

import deployments from "./deployments.json";

export type NetworkName = "undeployed" | "preview" | "preprod" | "mainnet";

export const NETWORK_ID = (process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK ||
  "undeployed") as NetworkName;

export const NETWORK_LABEL: Record<NetworkName, string> = {
  undeployed: "Midnight localnet",
  preview: "Midnight Preview",
  preprod: "Midnight Preprod",
  mainnet: "Midnight",
};

export type WalletMode = "connector" | "dev";

export const WALLET_MODE: WalletMode =
  (process.env.NEXT_PUBLIC_WALLET_MODE as WalletMode) ||
  (NETWORK_ID === "undeployed" ? "dev" : "connector");

interface Deployment {
  vault: string;
  registry: string;
  attesterPk?: {x: string; y: string};
}

const deployed = (deployments as Record<string, Deployment>)[NETWORK_ID];

export const VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_VAULT_ADDRESS || deployed?.vault || "";
export const REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || deployed?.registry || "";

export const LOCAL_ENDPOINTS = {
  indexer:
    process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL ||
    "http://localhost:8088/api/v4/graphql",
  indexerWS:
    process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_WS_URL ||
    "ws://localhost:8088/api/v4/graphql/ws",
  node: process.env.NEXT_PUBLIC_MIDNIGHT_NODE_URL || "http://localhost:9944",
  proofServer:
    process.env.NEXT_PUBLIC_MIDNIGHT_PROOF_SERVER_URL || "http://127.0.0.1:6300",
};

/** Read-only indexer for profile lookups before a wallet connects. */
export const READ_INDEXER =
  process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL ||
  (NETWORK_ID === "undeployed" ? LOCAL_ENDPOINTS.indexer : "");
export const READ_INDEXER_WS =
  process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_WS_URL ||
  (NETWORK_ID === "undeployed" ? LOCAL_ENDPOINTS.indexerWS : "");

export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "";

/** NIGHT has 6 decimals: 1 NIGHT = 1_000_000 base units (Stars). */
export const NIGHT_DECIMALS = 6;

export const ZK_PATHS = {
  hushh_vault: "/zk/hushh_vault",
  night_registry: "/zk/night_registry",
} as const;

export type ContractName = keyof typeof ZK_PATHS;

export function contractsConfigured(): boolean {
  return Boolean(VAULT_ADDRESS && REGISTRY_ADDRESS);
}
