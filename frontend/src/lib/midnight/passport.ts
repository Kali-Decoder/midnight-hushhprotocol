// Passport actions: create or unlock the master secret (passkey, or a
// passphrase where WebAuthn PRF is unavailable), claim a .night name, link X.

import {normalizeName, type NameRecord, type PassportKeys} from "@hushh/sdk";

import {linkEmailAddress, linkTwitter, registerName} from "@/lib/api";
import {
  createPasskey,
  passkeySecret,
  passkeysSupported,
  passphraseSecret,
  type PasskeyRef,
} from "./passkey";
import {getState, remember, resolveName, unlock, type RememberedPassport} from "./store";

/** Passphrase mode: no WebAuthn, or forced with ?passport=passphrase (demos, CI). */
export function usePassphrase(): boolean {
  if (typeof window === "undefined") return false;
  const forced = new URLSearchParams(window.location.search).get("passport") === "passphrase";
  return forced || !passkeysSupported();
}

function askPassphrase(name: string, confirm: boolean): string {
  const p = window.prompt(
    confirm
      ? `Choose a passphrase for ${name}.night (this device has no passkey support). You will need it to sign in.`
      : `Passphrase for ${name}.night`,
  );
  if (!p || p.length < 8) throw new Error("A passphrase of at least 8 characters is required.");
  return p;
}

async function newSecret(name: string): Promise<{master: Uint8Array; rem: RememberedPassport}> {
  if (usePassphrase()) {
    const master = await passphraseSecret(name, askPassphrase(name, true));
    return {master, rem: {name, method: "passphrase"}};
  }
  const ref: PasskeyRef = await createPasskey(name);
  const {secret} = await passkeySecret(ref);
  return {master: secret, rem: {name, method: "passkey", passkey: ref}};
}

async function existingSecret(rem: RememberedPassport | null, name?: string) {
  if (rem?.method === "passphrase" || (!rem && usePassphrase())) {
    const n = rem?.name ?? name;
    if (!n) throw new Error("Enter your .night name to sign in with a passphrase.");
    return {master: await passphraseSecret(n, askPassphrase(n, false)), passkey: undefined};
  }
  const {secret, credentialIdB64} = await passkeySecret(rem?.passkey);
  return {
    master: secret,
    passkey: rem?.passkey ?? {credentialIdB64, label: rem?.name ?? ""},
  };
}

/**
 * Claim `<name>.night`: new passkey -> keys -> register (unless these keys
 * already own a name, in which case this is just a sign-in).
 */
export async function claimPassport(rawName: string): Promise<{keys: PassportKeys; profile: NameRecord; txId?: string}> {
  const name = normalizeName(rawName);
  // Already registered? Then this is a returning user on a new device: use
  // their existing passkey instead of minting a second one.
  if (await resolveName(name)) {
    const {master, passkey} = await existingSecret(usePassphrase() ? {name, method: "passphrase"} : null, name);
    const {keys, profile} = await unlock(master);
    if (!profile || profile.name !== name) {
      throw new Error(`${name}.night is already taken by another passport.`);
    }
    remember({name, method: passkey ? "passkey" : "passphrase", passkey});
    return {keys, profile};
  }
  const {master, rem} = await newSecret(name);
  const {keys, profile} = await unlock(master);
  if (profile) {
    remember({...rem, name: profile.name});
    return {keys, profile};
  }
  const {txId} = await registerName(name, keys);
  const registered = getState().profile;
  if (!registered) throw new Error(`Registered ${name}.night but could not read it back yet. Refresh in a moment.`);
  remember(rem);
  return {keys, profile: registered, txId};
}

/** Unlock the remembered passport (or any passkey for this site). */
export async function signInPassport(name?: string): Promise<{keys: PassportKeys; profile: NameRecord | null}> {
  const rem = getState().remembered;
  const {master, passkey} = await existingSecret(rem, name);
  const res = await unlock(master);
  if (res.profile) {
    remember({
      name: res.profile.name,
      method: rem?.method ?? (passkey ? "passkey" : "passphrase"),
      passkey: passkey ?? rem?.passkey,
    });
  }
  return res;
}

/** Link the X account behind a Privy session (or a dev-mode handle) on-chain. */
export async function linkEmail(params: {privyAccessToken?: string; email?: string}) {
  const {keys, profile} = getState();
  if (!keys || !profile) throw new Error("Sign in to your passport first.");
  return linkEmailAddress({name: profile.name, keys, ...params});
}

export async function linkX(params: {privyAccessToken?: string; handle?: string}) {
  const {keys, profile} = getState();
  if (!keys || !profile) throw new Error("Sign in to your passport first.");
  return linkTwitter({name: profile.name, keys, ...params});
}
