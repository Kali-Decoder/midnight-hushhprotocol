// Social-link attestations. The attester (a server that has checked the
// user's X OAuth session) Jubjub-Schnorr-signs attestation_message(social,
// name). The registry verifies it in-circuit with jubjubSchnorrVerify against
// its sealed `attester` key.
//
// Both the message (the contract's exported pure circuit) and the signature
// scheme (compact-runtime's jubjubSchnorrSign) come from Midnight's own code,
// so the server and the circuit cannot disagree on encoding or hashing.

import {
  CompactTypeField,
  CompactTypeVector,
  jubjubSampleScalar,
  jubjubSchnorrSign,
  jubjubSchnorrVerify,
  jubjubSchnorrVerifyingKey,
  type JubjubPoint,
} from '@midnight-ntwrk/compact-runtime';

import * as Registry from './contracts/registry.js';
import { nameToBytes, normalizeName, socialToBytes } from './names.js';

const MSG_TYPE = new CompactTypeVector(1, CompactTypeField);

export interface Attestation {
  social: string;
  name: string;
  sig: { announcement: { x: string; y: string }; response: string };
}

export function attestationMessage(social: string, name: string): bigint {
  return Registry.pureCircuits.attestation_message(socialToBytes(social), nameToBytes(name));
}

/** Circuit-shaped signature argument for link_social. */
export function attestationSig(a: Attestation) {
  return {
    announcement: { x: BigInt(a.sig.announcement.x), y: BigInt(a.sig.announcement.y) } as JubjubPoint,
    response: BigInt(a.sig.response),
  };
}

export function signAttestation(attesterSecret: bigint, social: string, name: string): Attestation {
  const n = normalizeName(name);
  const sig = jubjubSchnorrSign(MSG_TYPE, [attestationMessage(social, n)], attesterSecret);
  return {
    social,
    name: n,
    sig: {
      announcement: { x: sig.announcement.x.toString(), y: sig.announcement.y.toString() },
      response: sig.response.toString(),
    },
  };
}

export function verifyAttestation(attesterPk: JubjubPoint, a: Attestation): boolean {
  return jubjubSchnorrVerify(MSG_TYPE, [attestationMessage(a.social, a.name)], attesterPk, attestationSig(a));
}

/** Attester public key (registry constructor argument). */
export function attesterPublicKey(attesterSecret: bigint): JubjubPoint {
  return jubjubSchnorrVerifyingKey(attesterSecret);
}

export function newAttesterSecret(): bigint {
  return jubjubSampleScalar();
}
