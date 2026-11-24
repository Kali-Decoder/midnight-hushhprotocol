import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  note_secret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { sk: Uint8Array,
                                                                            rho: bigint
                                                                          }];
}

export type ImpureCircuits<PS> = {
  deposit(context: __compactRuntime.CircuitContext<PS>,
          commitment_0: bigint,
          amount_0: bigint,
          ct_0: { epk: Uint8Array, nonce: Uint8Array, box: Uint8Array }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  claim(context: __compactRuntime.CircuitContext<PS>,
        recipient_0: { bytes: Uint8Array }): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  deposit(context: __compactRuntime.CircuitContext<PS>,
          commitment_0: bigint,
          amount_0: bigint,
          ct_0: { epk: Uint8Array, nonce: Uint8Array, box: Uint8Array }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  claim(context: __compactRuntime.CircuitContext<PS>,
        recipient_0: { bytes: Uint8Array }): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
  owner_key(sk_0: Uint8Array): bigint;
  note_commitment(owner_0: bigint, rho_0: bigint): bigint;
}

export type Circuits<PS> = {
  owner_key(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  note_commitment(context: __compactRuntime.CircuitContext<PS>,
                  owner_0: bigint,
                  rho_0: bigint): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  deposit(context: __compactRuntime.CircuitContext<PS>,
          commitment_0: bigint,
          amount_0: bigint,
          ct_0: { epk: Uint8Array, nonce: Uint8Array, box: Uint8Array }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  claim(context: __compactRuntime.CircuitContext<PS>,
        recipient_0: { bytes: Uint8Array }): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  tips: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): { amount: bigint, claimed: boolean };
    [Symbol.iterator](): Iterator<[bigint, { amount: bigint, claimed: boolean }]>
  };
  inbox: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): { commitment: bigint,
                             ct: { epk: Uint8Array,
                                   nonce: Uint8Array,
                                   box: Uint8Array
                                 }
                           };
    [Symbol.iterator](): Iterator<[bigint, { commitment: bigint,
  ct: { epk: Uint8Array, nonce: Uint8Array, box: Uint8Array }
}]>
  };
  readonly tip_count: bigint;
  readonly vault_balance: bigint;
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
