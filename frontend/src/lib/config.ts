import {EXPLORER_URL, NETWORK_ID, NETWORK_LABEL} from "@/lib/midnight/config";
import {
  DEFAULT_POOL_TOKEN,
  fromTokenUnits,
  getPoolToken,
  POOL_TOKENS,
  resolvePoolToken,
  toTokenUnits,
} from "@/lib/tokens";

export {POOL_TOKENS, DEFAULT_POOL_TOKEN, toTokenUnits, fromTokenUnits, getPoolToken, resolvePoolToken};
export type {PoolToken} from "@/lib/tokens";

export const NETWORK_NAME = NETWORK_LABEL[NETWORK_ID];

/** NIGHT presets for the amount pills. */
export const AMOUNT_PRESETS = [1, 10, 50, 100] as const;

/** Explorer link for a Midnight transaction, or "" when no explorer is configured. */
export function explorerTx(hash: string): string {
  return EXPLORER_URL && hash ? `${EXPLORER_URL}/tx/${hash}` : "";
}

/** Explorer link for an address, or "" when none is configured. */
export function explorerAddress(addr: string): string {
  return EXPLORER_URL && addr ? `${EXPLORER_URL}/address/${addr}` : "";
}
