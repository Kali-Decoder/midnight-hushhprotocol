// Witness implementations. Secrets are handed to a witness through a holder
// that is filled for exactly one circuit call and cleared afterwards, so a
// secret never lands in persisted private state.

import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';

export interface Holder<T> {
  current: T | null;
}

export interface NoteSecret {
  sk: Uint8Array;
  rho: bigint;
}

export function holder<T>(): Holder<T> {
  return { current: null };
}

function need<T>(h: Holder<T>, name: string): T {
  if (h.current === null) throw new Error(`witness ${name} requested but no secret is loaded`);
  return h.current;
}

export function makeVaultWitnesses(h: Holder<NoteSecret>) {
  return {
    note_secret(ctx: WitnessContext<any, any>): [any, { sk: Uint8Array; rho: bigint }] {
      const s = need(h, 'note_secret');
      return [ctx.privateState, { sk: s.sk, rho: s.rho }];
    },
  };
}

export function makeRegistryWitnesses(h: Holder<Uint8Array>) {
  return {
    name_secret(ctx: WitnessContext<any, any>): [any, Uint8Array] {
      return [ctx.privateState, need(h, 'name_secret')];
    },
  };
}

/** Load a secret for the duration of one call. Calls are serialised. */
let chain: Promise<unknown> = Promise.resolve();
export function withSecret<T, R>(h: Holder<T>, secret: T, fn: () => Promise<R>): Promise<R> {
  const run = chain.then(async () => {
    h.current = secret;
    try {
      return await fn();
    } finally {
      h.current = null;
    }
  });
  chain = run.catch(() => undefined);
  return run;
}
