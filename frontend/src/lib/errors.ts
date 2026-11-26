/**
 * Turn raw wallet / API / contract errors into short, plain-language copy
 * that someone who has never heard of ZK proofs or indexers can act on.
 * Anything that still looks technical falls back to a generic message; the
 * raw error always goes to the console for debugging.
 */

const API_MESSAGES: Record<string, string> = {
  unauthorized: "Session expired. Sign in again.",
  session_expired: "Session expired. Sign in again at /register.",
  recipient_not_found: "Recipient not found. They need to claim a username first.",
  recipient_required: "Recipient username is required.",
  invalid_wallet: "That wallet address is not valid.",
  invalid_username:
    "Names can be 2–27 characters: letters, numbers, - or _.",
  invalid_bullet_public_key: "Encryption key is invalid. Try reconnecting.",
  invalid_signature: "Signature format is invalid.",
  bad_signature: "Signature check failed. Sign the message again.",
  username_taken: "That username is already taken.",
  wallet_bound_to_other_username:
    "This wallet is already registered under a different username.",
  not_found: "Not found.",
  invalid_username_format: "Username format is invalid.",
  wallet_username_bulletPublicKey_required:
    "Missing wallet, username, or encryption key.",
  decrypt_failed: "Could not decrypt this note with the connected wallet.",
  http_400: "Request was rejected.",
  http_401: "Sign in required.",
  http_403: "You do not have access.",
  http_404: "Not found.",
  http_409: "Conflict with an existing account.",
  commitment_already_used:
    "This deposit commitment is already registered to another sender.",
  http_500: "Server error. Try again in a moment.",
  privy_not_configured: "Twitter linking is not configured on the server.",
  privy_token_required: "Privy session missing. Try Connect with Twitter again.",
  invalid_privy_token: "Twitter session expired. Connect with Twitter again.",
  twitter_not_linked_in_privy:
    "No Twitter account on this Privy session. Try again.",
  twitter_username_missing: "Twitter did not return a username.",
  twitter_already_linked:
    "That Twitter account is already linked to another wallet.",
};

const CONTRACT_HINTS: Array<{match: RegExp; message: string}> = [
  // Midnight contract asserts (hushh_vault / night_registry)
  {match: /tip already claimed/i, message: "This tip was already claimed."},
  {match: /unknown tip/i, message: "No tip matches this secret. It may be for a different passport."},
  {match: /name already taken/i, message: "That .night name is already taken."},
  {match: /not the name owner/i, message: "This passport does not own that .night name."},
  {match: /bad attestation/i, message: "The X attestation was rejected. Sign in with X again and retry."},
  {match: /commitment already used/i, message: "That tip already exists. Refresh and try again."},
  {match: /amount must be positive/i, message: "Enter an amount above zero."},
  {
    match: /Insufficient funds|could not balance|BalanceCheck|not enough dust|NotEnoughDust/i,
    message: "Not enough NIGHT, or not enough DUST to pay fees. Fund the wallet and retry.",
  },
  {
    match: /RootNotFound|root not found|unknown root/i,
    message:
      "The Midnight indexer has not caught up yet. Wait a few seconds, then retry.",
  },
  {
    match: /NullifierAlreadyUsed|nullifier already/i,
    message: "This note was already claimed.",
  },
  {
    match: /InvalidProof|invalid proof/i,
    message: "Proof was rejected by the contract. Try claiming again.",
  },
  {
    match: /InvalidRecipient|invalid recipient/i,
    message: "Recipient address is invalid.",
  },
  {
    match: /InvalidAmount|invalid amount/i,
    message: "Amount is invalid.",
  },
  {
    match: /InvalidToken|invalid token|unsupported token/i,
    message: "Token is not supported by the pool.",
  },
  {
    match: /insufficient (funds|allowance)|exceeds allowance|transfer amount exceeds/i,
    message: "Not enough NIGHT (or DUST for fees) in your wallet.",
  },
  {
    match: /execution reverted/i,
    message: "Transaction was rejected on Midnight. Check balance, DUST, network, and try again.",
  },
];

function rawString(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const anyErr = err as Error & {
      shortMessage?: string;
      details?: string;
      cause?: unknown;
      walk?: () => Error;
    };
    // viem often puts the useful bit in shortMessage
    if (anyErr.shortMessage) return anyErr.shortMessage;
    if (typeof anyErr.details === "string" && anyErr.details) {
      return `${anyErr.message} ${anyErr.details}`;
    }
    return anyErr.message || String(err);
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as {message: unknown}).message);
  }
  return String(err);
}

function isUserRejection(text: string): boolean {
  return /user rejected|user denied|rejected the request|denied transaction signature|request rejected/i.test(
    text
  );
}

/**
 * Everyday wording for the failures people actually hit. Checked before the
 * contract hints, first match wins.
 */
const FRIENDLY: Array<{match: RegExp; message: string}> = [
  // Wallet & passkey prompts
  {
    match: /user rejected|user denied|rejected the request|denied transaction|request rejected|NotAllowedError|not allowed by the user|operation either timed out or was not allowed/i,
    message: "You cancelled the request. Nothing was sent. Try again whenever you're ready.",
  },
  {match: /passkey (request|creation) was cancelled/i, message: "You closed the passkey prompt. Tap the button to try again."},
  {
    match: /no midnight wallet found|wallet not found|window\.midnight|not installed/i,
    message: "We couldn't find a Midnight wallet. Install the 1AM extension, then reload this page.",
  },
  {
    match: /wallet is locked|locked wallet|not authori[sz]ed|unauthori[sz]ed by wallet|connection refused by wallet/i,
    message: "Unlock your 1AM wallet and allow Hushh to connect, then try again.",
  },
  {
    match: /network id|wrong network|network mismatch|EraMismatch|ledger version|version mismatch/i,
    message: "Your wallet is on a different Midnight network. Switch 1AM to Preprod and try again.",
  },
  {match: /indexerUri|indexerWsUri|usable indexer/i, message: "Your wallet didn't share its network settings. Reconnect 1AM and try again."},
  // Passport
  {match: /no secret is loaded|witness .* requested|passport.*locked/i, message: "Your passport is locked. Sign in with your passkey and try again."},
  {match: /names are 2-27 chars/i, message: "Names can be 2–27 characters: letters, numbers, - or _."},
  {match: /attestation failed|attestation was rejected|bad attestation/i, message: "We couldn't verify your X or email account. Sign in to it again and retry."},
  {match: /PRF output length|master secret must be/i, message: "This passkey can't be used for Hushh. Try another device or a passphrase."},
  // Funds & fees
  {
    match: /insufficient|not enough (night|dust|funds)|NotEnoughDust|could not balance|BalanceCheck|exceeds allowance/i,
    message: "Not enough tNIGHT, or not enough tDUST for the network fee. Top up your wallet and try again.",
  },
  {match: /amount out of u64|amount must be positive|invalid amount/i, message: "Enter an amount above zero."},
  // Network / connectivity
  {
    match: /failed to fetch|networkerror|network request failed|ERR_NETWORK|ECONNREFUSED|ENOTFOUND|websocket|socket hang up|load failed/i,
    message: "We couldn't reach the Midnight network. Check your internet connection and try again.",
  },
  {match: /timed? ?out|timeout|deadline exceeded/i, message: "This is taking longer than usual. Please try again in a moment."},
  {match: /RootNotFound|root not found|unknown root|not caught up/i, message: "The network is still catching up. Wait a few seconds and try again."},
  {match: /proof server|prov(ing|er) (failed|error)|failed to prove|InvalidProof|invalid proof/i, message: "We couldn't create the privacy proof. Keep your wallet open and try again."},
  {match: /no contract state|contract not found|not deployed/i, message: "Hushh can't reach its contracts right now. Please try again shortly."},
  {match: /without a transaction id|without an identifier|submission (failed|error)|SubmissionError/i, message: "Your wallet didn't confirm the transaction. Please try again."},
  // Links & sharing
  {match: /odd-length hex|invalid character|invalid claim link|malformed/i, message: "This link looks broken. Ask the sender for a new one."},
  {match: /canvas_unavailable/i, message: "Your browser couldn't create the image. Try another browser."},
];

/** Signs that a message was written for developers, not people. */
const TECHNICAL =
  /\b[A-Z][A-Za-z]*(Error|Exception)\b|\b0x[0-9a-f]{6,}|[0-9a-f]{24,}|[{}[\]<>]|\bat [\w.$<>]+ ?\(|\w+\.(ts|js|tsx|rs):\d+|::|\bundefined\b|\bnull\b|\bNaN\b|is not a function|cannot read propert|unexpected token|stack|panic|wasm|NEXT_PUBLIC/i;

const GENERIC = "Something went wrong on our side. Please try again.";

function matchFriendly(text: string): string | null {
  for (const r of FRIENDLY) if (r.match.test(text)) return r.message;
  for (const hint of CONTRACT_HINTS) if (hint.match.test(text)) return hint.message;
  return null;
}

/** Human-readable error for banners and toasts. */
export function formatError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = rawString(err).trim();
  if (!raw) return fallback;

  // Exact API snake_case codes
  const code = raw.replace(/^error:\s*/i, "").trim();
  if (API_MESSAGES[code]) return API_MESSAGES[code];
  const http = raw.match(/^http_(\d+)$/);
  if (http && API_MESSAGES[`http_${http[1]}`]) return API_MESSAGES[`http_${http[1]}`];

  if (isUserRejection(raw)) return FRIENDLY[0].message;

  const friendly = matchFriendly(raw);
  if (friendly) return friendly;

  // Strip wrapper boilerplate and keep the first line only.
  const cleaned = raw
    .replace(/^(\w+Error|Error):\s*/i, "")
    .split("\n")[0]
    .replace(/\s+/g, " ")
    .trim();

  const again = matchFriendly(cleaned);
  if (again) return again;

  // Our own product copy reads like a sentence: keep it. Anything that looks
  // like a stack trace, code or hex goes to the console instead.
  if (cleaned && cleaned.length <= 220 && !TECHNICAL.test(cleaned)) {
    return cleaned;
  }
  if (typeof console !== "undefined") console.error("[hushh] error shown as generic message:", err);
  return GENERIC;
}

/** Short banner heading in plain words. */
export function formatErrorTitle(err: unknown): string {
  const msg = formatError(err);
  if (/cancelled|closed the passkey/i.test(msg)) return "Cancelled";
  if (/sign in|passport is locked|session expired/i.test(msg)) return "Sign in needed";
  if (/different midnight network|switch/i.test(msg)) return "Wrong network";
  if (/install|unlock your 1am|reconnect/i.test(msg)) return "Wallet needed";
  if (/catching up|longer than usual|internet|reach/i.test(msg)) return "Connection trouble";
  if (/tnight|tdust|amount/i.test(msg)) return "Not enough funds";
  if (/taken|already/i.test(msg)) return "Already in use";
  if (/link looks broken/i.test(msg)) return "Broken link";
  return "Something went wrong";
}
