// Passport master secret from a passkey (WebAuthn PRF), adapted from the
// Midnight Passport foundations demo.
//
// The secret is the PRF output for a fixed, domain-separated salt: it never
// leaves this browsing context, is re-derived on every unlock, and is as
// hardware-bound as the authenticator. It is never written to storage.
//   - PRF results are only guaranteed during get(), so onboarding runs
//     create() followed by one get().
//   - Needs a user gesture and a secure context (localhost is fine).

const PRF_SALT = new TextEncoder().encode("hushh:passport:prf:v1");
const RP_NAME = "Hushh Protocol";

/** The authenticator can't derive a secret (no WebAuthn PRF). Callers may fall back to a passphrase. */
export class PrfUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrfUnsupportedError";
  }
}

export interface PasskeyRef {
  credentialIdB64: string;
  label: string;
}

function rpEntity(): PublicKeyCredentialRpEntity {
  const host = window.location.hostname;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host === "[::1]") return {name: RP_NAME};
  return {name: RP_NAME, id: host};
}

function explain(error: unknown): string {
  const message = String((error as {message?: unknown})?.message ?? error);
  if (/invalid domain|relying party|rp id|security/i.test(message)) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)
      ? "Passkeys don't work on an IP address. Open the app at http://localhost:3000 instead."
      : "Passkeys aren't available on this page. Open the app at hushh.accuracy.wtf and try again.";
  }
  if (/NotAllowedError|timed out|not allowed/i.test(message)) {
    return "You closed the passkey prompt. Tap the button to try again.";
  }
  return message;
}

function b64encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bytes = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bytes.length));
  for (let i = 0; i < bytes.length; i++) out[i] = bytes.charCodeAt(i);
  return out;
}

export function passkeysSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function createPasskey(label: string): Promise<PasskeyRef> {
  const stable = label.trim().toLowerCase();
  let cred: PublicKeyCredential | null;
  try {
    cred = (await navigator.credentials.create({
      publicKey: {
        rp: rpEntity(),
        user: {
          id: await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`hushh:passport:user:v1:${stable}`)),
          name: `${stable}.night`,
          displayName: `${stable}.night`,
        },
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        pubKeyCredParams: [
          {type: "public-key", alg: -7},
          {type: "public-key", alg: -257},
        ],
        authenticatorSelection: {residentKey: "required", userVerification: "required"},
        extensions: {prf: {}} as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential | null;
  } catch (e) {
    throw new Error(explain(e));
  }
  if (!cred) throw new Error("Passkey creation was cancelled.");
  // Don't trust `prf.enabled` from create(): Chrome/Edge (<=146) with Windows
  // Hello don't report it at creation even though get() returns PRF results.
  // passkeySecret() right after is the real test and throws
  // PrfUnsupportedError if the authenticator truly can't do PRF.
  return {credentialIdB64: b64encode(cred.rawId), label: stable};
}

/** Evaluate the PRF for our salt: the 32-byte passport master secret. */
export async function passkeySecret(ref?: PasskeyRef): Promise<{secret: Uint8Array; credentialIdB64: string}> {
  let assertion: PublicKeyCredential | null;
  try {
    assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: ref ? [{type: "public-key", id: b64decode(ref.credentialIdB64)}] : [],
        userVerification: "required",
        extensions: {prf: {eval: {first: PRF_SALT}}} as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential | null;
  } catch (e) {
    throw new Error(explain(e));
  }
  if (!assertion) throw new Error("Passkey request was cancelled.");
  const result = (assertion.getClientExtensionResults() as {prf?: {results?: {first?: ArrayBuffer}}})?.prf?.results
    ?.first;
  if (!result) {
    throw new PrfUnsupportedError(
      "This device's passkey can't unlock a Hushh passport yet. On Windows, update Windows 11 and use the latest Chrome, Edge or Firefox. You can also use your phone's passkey, or a passphrase.",
    );
  }
  const secret = new Uint8Array(result);
  if (secret.length !== 32) throw new Error(`Unexpected PRF output length ${secret.length}.`);
  return {secret, credentialIdB64: b64encode(assertion.rawId)};
}

/** Fallback for authenticators without PRF: a passphrase, hashed. Demo grade. */
export async function passphraseSecret(name: string, passphrase: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(`hushh:passport:passphrase:v1:${name.toLowerCase()}:${passphrase}`);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}
