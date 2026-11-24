// Scratch gift cards on Midnight.
//
// A gift is a normal vault tip. The share link carries the card design plus
// ONE of:
//   commitment  tip bound to the recipient's passport: only they can claim it
//               (the link itself holds no secret);
//   link        a claim-link secret: whoever holds the link can claim
//               (used when the recipient has no .night passport yet).

export type ScratchTheme = "crimson" | "azure" | "emerald";

export type ScratchGiftMeta = {
  /** Scratch card name shown on the left panel. */
  title: string;
  message?: string;
  theme: ScratchTheme;
};

export type ScratchClaimPayload = {
  kind: "scratch";
  amountLabel: string;
  tokenSymbol: string;
  recipientUsername?: string;
  meta: ScratchGiftMeta;
  /** Hex commitment of a passport-bound tip. */
  commitment?: string;
  /** Encoded claim-link secret (anyone holding the link can claim). */
  link?: string;
};

function toBase64Url(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return decodeURIComponent(escape(atob(padded + pad)));
}

function normalizeTheme(raw: unknown): ScratchTheme {
  if (raw === "azure" || raw === "crimson" || raw === "emerald") return raw;
  if (raw === "violet") return "azure";
  if (raw === "sunset") return "crimson";
  return "crimson";
}

export function createScratchClaimPayload(params: {
  amountLabel: string;
  tokenSymbol: string;
  recipientUsername?: string;
  meta: ScratchGiftMeta;
  commitment?: string;
  link?: string;
}): ScratchClaimPayload {
  return {
    kind: "scratch",
    amountLabel: params.amountLabel,
    tokenSymbol: params.tokenSymbol,
    recipientUsername: params.recipientUsername,
    commitment: params.commitment,
    link: params.link,
    meta: {
      ...params.meta,
      theme: normalizeTheme(params.meta.theme),
      title: params.meta.title.trim() || "Scratch & Win",
      ...(params.meta.message?.trim() ? {message: params.meta.message.trim()} : {}),
    },
  };
}

export function encodeScratchClaimPayload(payload: ScratchClaimPayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeScratchClaimPayload(encoded: string): ScratchClaimPayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as ScratchClaimPayload;
    if (parsed?.kind !== "scratch" || !parsed.meta) return null;
    if (!parsed.commitment && !parsed.link) return null;
    parsed.meta.theme = normalizeTheme(parsed.meta.theme);
    return parsed;
  } catch {
    return null;
  }
}

export function scratchClaimPath(encoded: string): string {
  return `/c?p=${encodeURIComponent(encoded)}`;
}

// ── Gift cards this device has opened (for the Inbox "Gift cards" tab) ──────

const OPENED_KEY = "hushh.openedGifts";

export function rememberOpenedGift(p: ScratchClaimPayload) {
  if (!p.commitment || typeof window === "undefined") return;
  const all = openedGifts();
  all[p.commitment] = p;
  localStorage.setItem(OPENED_KEY, JSON.stringify(all));
}

export function openedGifts(): Record<string, ScratchClaimPayload> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(OPENED_KEY) || "{}");
  } catch {
    return {};
  }
}
