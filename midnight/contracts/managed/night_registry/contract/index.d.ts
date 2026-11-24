import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  name_secret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  register_name(context: __compactRuntime.CircuitContext<PS>,
                name_0: Uint8Array,
                tip_pk_0: bigint,
                enc_pk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  update_keys(context: __compactRuntime.CircuitContext<PS>,
              name_0: Uint8Array,
              tip_pk_0: bigint,
              enc_pk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  link_social(context: __compactRuntime.CircuitContext<PS>,
              name_0: Uint8Array,
              social_0: Uint8Array,
              sig_0: { announcement: __compactRuntime.JubjubPoint,
                       response: bigint
                     }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  unlink_social(context: __compactRuntime.CircuitContext<PS>, name_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  register_name(context: __compactRuntime.CircuitContext<PS>,
                name_0: Uint8Array,
                tip_pk_0: bigint,
                enc_pk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  update_keys(context: __compactRuntime.CircuitContext<PS>,
              name_0: Uint8Array,
              tip_pk_0: bigint,
              enc_pk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  link_social(context: __compactRuntime.CircuitContext<PS>,
              name_0: Uint8Array,
              social_0: Uint8Array,
              sig_0: { announcement: __compactRuntime.JubjubPoint,
                       response: bigint
                     }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  unlink_social(context: __compactRuntime.CircuitContext<PS>, name_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
  name_owner_key(sk_0: Uint8Array): bigint;
  attestation_message(social_0: Uint8Array, name_0: Uint8Array): bigint;
}

export type Circuits<PS> = {
  name_owner_key(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  attestation_message(context: __compactRuntime.CircuitContext<PS>,
                      social_0: Uint8Array,
                      name_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  register_name(context: __compactRuntime.CircuitContext<PS>,
                name_0: Uint8Array,
                tip_pk_0: bigint,
                enc_pk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  update_keys(context: __compactRuntime.CircuitContext<PS>,
              name_0: Uint8Array,
              tip_pk_0: bigint,
              enc_pk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  link_social(context: __compactRuntime.CircuitContext<PS>,
              name_0: Uint8Array,
              social_0: Uint8Array,
              sig_0: { announcement: __compactRuntime.JubjubPoint,
                       response: bigint
                     }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  unlink_social(context: __compactRuntime.CircuitContext<PS>, name_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  names: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { owner: bigint,
                                 tip_pk: bigint,
                                 enc_pk: Uint8Array,
                                 social: Uint8Array,
                                 index: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { owner: bigint,
  tip_pk: bigint,
  enc_pk: Uint8Array,
  social: Uint8Array,
  index: bigint
}]>
  };
  socials: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  readonly name_count: bigint;
  readonly attester: __compactRuntime.JubjubPoint;
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               attester_pk_0: __compactRuntime.JubjubPoint): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
