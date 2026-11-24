# Hushh Protocol frontend

Next.js 15 app for Hushh on Midnight. The UI is the original Hushh design; the data layer talks to the `night_registry` and `hushh_vault` Compact contracts in `../midnight`.

```bash
# contracts + localnet first (see ../README.md)
cd ../midnight && npm run localnet:up && npm run deploy

cd ../frontend
pnpm install
cp .env.example .env.local   # add ATTESTER_DEV_MODE=1 for a localnet demo without Privy
pnpm dev                     # http://localhost:3000
```

`pnpm dev` / `pnpm build` first run `scripts/sync-zk.mjs`, which copies the compiled proving assets into `public/zk/` and the deployment addresses into `src/lib/midnight/deployments.json`.

## Where things live

| Path | Purpose |
|------|---------|
| `src/lib/midnight/config.ts` | Network, wallet mode, contract addresses, endpoints |
| `src/lib/midnight/wallet.ts` | Wallet backends: DApp Connector (1AM / Lace) and the localnet dev wallet |
| `src/lib/midnight/passkey.ts` | WebAuthn PRF -> passport master secret (passphrase fallback) |
| `src/lib/midnight/passport.ts` | Claim / sign in / link X |
| `src/lib/midnight/store.ts` | App state: wallet, unlocked keys, `.night` profile, contract clients |
| `src/lib/midnight/hooks.ts` | `useAccount`, `useConnect`, `useDisconnect`, `useIsCorrectNetwork` |
| `src/lib/api.ts` | Resolve users, send tips / claim links, inbox, claim, history |
| `src/app/api/social/attest/route.ts` | X attester (Privy check + Jubjub signature) |
| `../midnight/src/sdk` | Shared SDK (`@hushh/sdk`): keys, sealing, witnesses, clients |

## Wallets

- **Localnet** (`NEXT_PUBLIC_MIDNIGHT_NETWORK=undeployed`): the genesis-funded wallet runs inside the page and pays every fee. Every user on the page shares its NIGHT.
- **Preview / preprod**: users connect 1AM (preferred) or Lace. The wallet proves, balances and pays DUST.

## Passport

The passport master secret comes from a passkey (WebAuthn PRF) and never leaves the browser. Once unlocked it is kept in `sessionStorage` for the tab, so page loads do not re-prompt; it is cleared on sign-out and when the tab closes. Add `?passport=passphrase` to use a passphrase instead (no PRF support, automated tests).
