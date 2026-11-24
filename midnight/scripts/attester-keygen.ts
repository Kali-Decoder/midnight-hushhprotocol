// Generate a social-attester key for a public network.
//   npm run attester:keygen
// Put ATTESTER_SECRET in the frontend's server env (never commit it, never
// expose it as NEXT_PUBLIC_*). The registry is deployed with the public key,
// which the /deploy page reads from /api/social/attester.
import { attesterPublicKey, newAttesterSecret } from '../src/sdk/attestation.js';

const secret = newAttesterSecret();
const pk = attesterPublicKey(secret);
console.log('# Server env (keep secret):');
console.log(`ATTESTER_SECRET=${secret}`);
console.log('\n# Public key (goes on-chain in the registry constructor):');
console.log(JSON.stringify({ x: pk.x.toString(), y: pk.y.toString() }, null, 2));
