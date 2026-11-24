// Deploy the Night registry and the Hushh vault, then write
// deployments/<network>.json. Usage: npm run deploy
import { attesterPublicKey } from '../sdk/attestation.js';
import { RegistryClient, VaultClient } from '../sdk/client.js';
import { holder, type NoteSecret } from '../sdk/witnesses.js';
import { compiledRegistry, compiledVault, attesterSecret, writeDeployment, DEPLOYMENT_FILE } from './contracts.js';
import { CONFIG, createProviders, createWallet, registryZkPath, syncWallet, vaultZkPath } from './wallet.js';

const seed = process.env.WALLET_SEED ?? '0000000000000000000000000000000000000000000000000000000000000001';
const walletCtx = await createWallet(seed);
await syncWallet(walletCtx, 'deployer wallet');

const pk = attesterPublicKey(attesterSecret());

console.log('Deploying night_registry…');
const registry = await RegistryClient.deploy(
  await createProviders(walletCtx, registryZkPath),
  compiledRegistry(holder<Uint8Array>()),
  holder<Uint8Array>(),
  pk,
);
console.log(`  registry ${registry.address}`);

console.log('Deploying hushh_vault…');
const vaultSecret = holder<NoteSecret>();
const vault = await VaultClient.deploy(await createProviders(walletCtx, vaultZkPath), compiledVault(vaultSecret), vaultSecret);
console.log(`  vault    ${vault.address}`);

writeDeployment({
  network: process.env.MIDNIGHT_NETWORK ?? 'local',
  networkId: CONFIG.networkId,
  vault: vault.address,
  registry: registry.address,
  attesterPk: { x: pk.x.toString(), y: pk.y.toString() },
  deployedAt: new Date().toISOString(),
});
console.log(`Wrote ${DEPLOYMENT_FILE}`);
await walletCtx.wallet.stop();
process.exit(0);
