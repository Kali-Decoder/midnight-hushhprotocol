// Single import point for the compiled Hushh vault contract module.
import * as VaultModule from '../../../contracts/managed/hushh_vault/contract/index.js';
export type { Ledger, Witnesses } from '../../../contracts/managed/hushh_vault/contract/index.js';
export const { Contract, ledger, pureCircuits } = VaultModule as any as typeof VaultModule;
