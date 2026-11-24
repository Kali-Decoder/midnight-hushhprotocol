// In-process contract simulator over @midnight-ntwrk/compact-runtime: runs
// circuits and witnesses against a local state, no node/indexer/prover.
// Token effects (receive/sendUnshielded) are recorded but not settled.

import {
  createConstructorContext,
  createCircuitContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';

const COIN_PUBLIC_KEY = '00'.repeat(32);

export class Simulator<L> {
  readonly address = sampleContractAddress();
  private state: any;
  private privateState: any = {};
  private zswap: any = COIN_PUBLIC_KEY;

  private constructor(private readonly contract: any, private readonly decode: (s: any) => L, init: any) {
    this.state = init.currentContractState.data;
    this.zswap = init.currentZswapLocalState;
  }

  static async create<L>(ContractClass: any, witnesses: any, decode: (s: any) => L, ...args: unknown[]) {
    const contract = new ContractClass(witnesses);
    const init = await contract.initialState(createConstructorContext({}, COIN_PUBLIC_KEY), ...args);
    return new Simulator<L>(contract, decode, init);
  }

  async call(circuit: string, ...args: unknown[]): Promise<{ result: unknown; effects: any }> {
    const ctx = createCircuitContext({
      circuitId: circuit,
      contractAddress: this.address,
      coinPublicKeyOrZswapState: this.zswap,
      contractState: this.state,
      privateState: this.privateState,
    } as any);
    const r = await this.contract.impureCircuits[circuit](ctx, ...args);
    this.state = r.context.callContext.currentQueryContext.state;
    this.zswap = r.context.callContext.currentZswapLocalState ?? this.zswap;
    return { result: r.result, effects: r.context.callContext.currentQueryContext.effects };
  }

  ledger(): L {
    return this.decode(this.state);
  }
}
