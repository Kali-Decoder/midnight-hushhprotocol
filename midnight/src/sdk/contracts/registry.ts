// Single import point for the compiled Night registry contract module.
import * as RegistryModule from '../../../contracts/managed/night_registry/contract/index.js';
export type { Ledger, Witnesses } from '../../../contracts/managed/night_registry/contract/index.js';
export const { Contract, ledger, pureCircuits } = RegistryModule as any as typeof RegistryModule;
