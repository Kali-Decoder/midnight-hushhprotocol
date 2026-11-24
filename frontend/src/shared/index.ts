/**
 * Types shared across the Hushh frontend (Midnight build).
 *
 * Identity lives on-chain in the night_registry contract; payments live in
 * the hushh_vault contract. There is no backend database.
 */

/** A .night passport as the UI sees it. */
export interface PublicUser {
  /** The .night name (also used as a stable id). */
  id: string;
  /**
   * For the signed-in user: their connected wallet address.
   * For anyone else: their public tip key (hex), used for avatars only.
   */
  wallet: string;
  /** .night name, lowercase, no "@" and no ".night". */
  username: string;
  /** X25519 key tips are sealed to (hex). */
  bulletPublicKey: string;
  /** Linked X handle (no @), proven on-chain by an attestation. */
  twitterUsername?: string | null;
  /** True when a verified email is linked (only its hash is on-chain). */
  emailLinked?: boolean;
  /** Registration order in the night_registry (0-based). */
  index?: number;
  /** Vault owner key tips are bound to (decimal Field). */
  tipPk?: string;
  createdAt?: string | Date;
}

export interface NoteHistoryItem {
  id: string;
  direction: "sent" | "received";
  commitment: string;
  claimed: boolean;
  claimTxHash?: string;
  depositTxHash?: string;
  amount?: string;
  tokenSymbol?: string;
  createdAt: string | Date;
  fromUsername?: string;
  toUsername?: string;
  fromWallet?: string;
  toWallet?: string;
  counterpartyUsername?: string;
  counterpartyWallet?: string;
}

export interface NoteHistoryPage {
  items: NoteHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  direction: "sent" | "received";
}
