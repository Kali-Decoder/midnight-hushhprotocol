import {NIGHT_DECIMALS} from "@/lib/midnight/config";

export type PoolToken = {
  /** Stable id for React keys (Midnight raw token type for NIGHT). */
  address: string;
  symbol: string;
  decimals: number;
  enabled: boolean;
  /** Public path to token logo (SVG/PNG). */
  logo: string;
};

/** The Hushh vault holds one asset: unshielded NIGHT. */
export const POOL_TOKENS: readonly PoolToken[] = [
  {
    address: "night",
    symbol: "NIGHT",
    decimals: NIGHT_DECIMALS,
    enabled: true,
    logo: "/tokens/night.png",
  },
] as const;

export const DEFAULT_POOL_TOKEN = POOL_TOKENS[0];

export function getPoolToken(addressOrSymbol: string): PoolToken | undefined {
  const q = addressOrSymbol.trim().toLowerCase();
  return POOL_TOKENS.find(
    (t) => t.enabled && (t.address.toLowerCase() === q || t.symbol.toLowerCase() === q)
  );
}

export function toTokenUnits(amount: number, decimals: number): bigint {
  const [whole, frac = ""] = amount.toFixed(decimals).split(".");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, "0") || "0");
}

export function fromTokenUnits(raw: bigint | string, decimals: number): string {
  const n = typeof raw === "bigint" ? raw : BigInt(raw);
  const base = 10n ** BigInt(decimals);
  const whole = n / base;
  const frac = n % base;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(decimals, "0").replace(/0+$/, "")}`;
}

export function resolvePoolToken(_opts?: {tokenSymbol?: string | null}): PoolToken {
  return DEFAULT_POOL_TOKEN;
}
