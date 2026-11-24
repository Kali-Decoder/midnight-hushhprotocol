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
    return "Passkeys need a valid domain. Open the app at http://localhost:3000 (not 127.0.0.1) and try again.";
  }
  if (/NotAllowedError|timed out|not allowed/i.test(message)) {
    return "Passkey request was cancelled.";
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
  const ext = cred.getClientExtensionResults() as {prf?: {enabled?: boolean}};
  if (!ext?.prf?.enabled) {
    throw new Error(
      "This authenticator does not support the WebAuthn PRF extension. Use a platform passkey (Touch ID, Windows Hello, recent Android) or use a passphrase instead.",
    );
  }
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
  if (!result) throw new Error("This passkey did not return a PRF result. Use a passphrase instead.");
  const secret = new Uint8Array(result);
  if (secret.length !== 32) throw new Error(`Unexpected PRF output length ${secret.length}.`);
  return {secret, credentialIdB64: b64encode(assertion.rawId)};
}

/** Fallback for authenticators without PRF: a passphrase, hashed. Demo grade. */
export async function passphraseSecret(name: string, passphrase: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(`hushh:passport:passphrase:v1:${name.toLowerCase()}:${passphrase}`);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}
