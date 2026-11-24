# Hushh Protocol on Midnight

Own your `.night` name with **Midnight Passport**, link your X handle to it, and get paid in NIGHT. Tips are sealed to the recipient's passport and claimed with a zero-knowledge proof that Midnight verifies natively.

Tagline: send silently.

**Live app:** https://midnight-hushh.vercel.app · **X:** [@hushhprotocol](https://x.com/hushhprotocol)

> Prototype. Contracts are unaudited and target the local devnet and Midnight test networks. Do not use with real value.

---

## What it does

| Step | What happens | Where |
|------|--------------|-------|
| **Claim a passport** | A passkey (WebAuthn PRF) derives your keys. Your X handle becomes `<handle>.night`. No seed phrase. | `night_registry.register_name` |
| **Link X** | The app signs you in with X (Privy). A server attester Jubjub-signs "x:handle belongs to name.night"; the contract checks the signature in-circuit. | `night_registry.link_social` |
| **Link email** | Privy verifies the email with a one-time code; the attester signs "email belongs to name.night". Only a SHA-256 hash of the email goes on-chain, next to the X handle. | `night_registry.link_email` |
| **Send** | Pay `alice.night` or `@alice`. The app reads her passport keys from the registry, seals the tip to her X25519 key, and deposits NIGHT in one transaction. | `hushh_vault.deposit` |
| **Inbox** | Alice finds her tips by trial-decrypting the vault's on-chain inbox with her passport key. No backend inbox. | client-side scan |
| **Claim** | A Compact circuit proves she knows the tip's secret and it was never claimed. NIGHT goes to her wallet. | `hushh_vault.claim` |
| **Claim links / scratch cards** | Pay someone who has no passport yet: the link carries a one-time secret. Scratch cards add a design to the same tip. | `deposit` + `claim` |

## Privacy, stated plainly

**Private**
- Passport secrets never leave the device; the chain stores only hashes of your keys.
- A payment never names the recipient. Their name, X handle and keys are not in the tip.
- A tip sent to a passport is bound to the recipient's key: the sender cannot claim it back.
- No server learns who got paid.

**Not private**
- Tips are unshielded NIGHT: sender wallet, amount and receiving wallet are public.
- Claims are checked against a plain map of commitments, so a claim reveals which deposit it spent. An observer can link the paying wallet to the claiming wallet. (A Merkle-tree claim would hide this; not in this build.)
- Names, payment keys and linked X handles are public by design, so people can pay you.
- Claim links are bearer secrets.

## Architecture

### System overview

```mermaid
flowchart TB
  subgraph USER["User device"]
    PK["Passkey<br/>WebAuthn PRF"]
    subgraph APP["Hushh app · Next.js"]
      UI["Hushh UI<br/>send · inbox · scratch · profile"]
      PASS["Midnight Passport<br/>key derivation"]
      SDK["@hushh/sdk<br/>seal · scan · witnesses · clients"]
      MJS["Midnight.js 5"]
    end
    WAL["Midnight wallet<br/>1AM / Lace · localnet dev wallet"]
  end

  subgraph SERVER["Hushh server"]
    ATT["/api/social/attest<br/>Jubjub signer · no funds"]
  end
  PRIVY["Privy<br/>X OAuth"]

  subgraph MN["Midnight network · Ledger 9"]
    REG[("night_registry<br/>names · socials")]
    VAULT[("hushh_vault<br/>tips · inbox")]
    IDX["Indexer<br/>GraphQL"]
    PROOF["Proof server<br/>or wallet prover"]
  end

  PK -->|"PRF secret"| PASS
  UI --> PASS
  UI --> SDK
  PASS --> SDK
  SDK --> MJS
  MJS -->|"prove circuit calls"| PROOF
  MJS -->|"balance, sign, submit"| WAL
  WAL -->|"transactions"| REG
  WAL -->|"transactions"| VAULT
  MJS -->|"read contract state"| IDX
  IDX --- REG
  IDX --- VAULT
  UI -->|"X sign-in"| PRIVY
  UI -->|"name + Privy token"| ATT
  ATT -->|"verify token, read linked X"| PRIVY
  ATT -->|"signed attestation"| UI
```

Nothing secret leaves the device: the passkey secret, tip key and note secrets are only ever used as private witnesses inside proofs. The server only signs "this X handle belongs to this .night name" after checking the X login.

### Midnight Passport: one passkey, three keys

```mermaid
flowchart LR
  PK["Passkey<br/>PRF salt hushh:passport:prf:v1"] --> M["Master secret<br/>32 bytes, never stored"]
  M -->|"sha256 'tip'"| TK["tipKey"]
  M -->|"sha256 'name'"| NK["nameSecret"]
  M -->|"sha256 'x25519'"| BK["X25519 box keypair"]
  TK -->|"owner_key()"| TPK["tip_pk<br/>public"]
  NK -->|"name_owner_key()"| NO["owner<br/>public"]
  BK --> EPK["enc_pk<br/>public"]
  TPK --> REC[("name.night record<br/>in night_registry")]
  NO --> REC
  EPK --> REC
```

The public halves go into the `.night` record so anyone can pay you. The secret halves are re-derived from the passkey at every sign-in (a passphrase is the fallback where PRF is unavailable).

### Flow 1: claim a passport and link X

```mermaid
sequenceDiagram
  autonumber
  actor A as Alice
  participant App as Hushh app
  participant P as Privy
  participant Att as Attester API
  participant R as night_registry

  A->>App: Connect wallet
  A->>P: Sign in with X
  P-->>App: X handle alice
  A->>App: Sign and claim @alice
  App->>App: Create passkey, derive keys from PRF
  App->>R: register_name(alice, tip_pk, enc_pk)
  Note over R: proves knowledge of nameSecret<br/>owner = name_owner_key(nameSecret)<br/>rejects taken names
  App->>Att: name=alice + Privy access token
  Att->>P: verify token, read linked X account
  Att-->>App: Jubjub signature over (x:alice, alice)
  App->>R: link_social(alice, x:alice, signature)
  Note over R: proves name ownership<br/>jubjubSchnorrVerify against sealed attester key<br/>socials[x:alice] = alice
```

### Flow 2: send a tip to `@alice`

```mermaid
sequenceDiagram
  autonumber
  actor B as Bob
  participant App as Hushh app
  participant R as night_registry
  participant W as Bob's wallet
  participant V as hushh_vault

  B->>App: Pay @alice 5 NIGHT
  App->>R: read socials[x:alice] then names[alice]
  R-->>App: tip_pk, enc_pk
  App->>App: rho = random field element<br/>commitment = H(tip_pk, rho)<br/>note = seal(amount, rho) to enc_pk
  App->>V: deposit(commitment, 5 NIGHT, sealed note)
  W->>V: 5 NIGHT in (balanced and paid by the wallet)
  Note over V: tips[commitment] = {5, unclaimed}<br/>inbox[n] = {commitment, sealed note}
  Note over V: public: amount, commitment, ciphertext, Bob's wallet<br/>not public: alice, her X handle, her keys
```

If `@alice` has no passport yet, the same deposit is made to a one-time key and Bob gets a claim link instead (Flow 4).

### Flow 3: inbox scan and zero-knowledge claim

```mermaid
sequenceDiagram
  autonumber
  actor A as Alice
  participant App as Hushh app
  participant I as Indexer
  participant V as hushh_vault
  participant W as Alice's wallet

  A->>App: Open Inbox (passport unlocked)
  App->>I: read vault state
  I-->>App: inbox entries + tips map
  App->>App: trial-decrypt each note with X25519 key<br/>keep only if H(tip_pk, rho) == entry.commitment
  App-->>A: 5 NIGHT unclaimed
  A->>App: Claim
  App->>App: prove claim with private witness (tipKey, rho)
  App->>V: claim(recipient = Alice's wallet address)
  Note over V: in-circuit:<br/>1. commitment = H(owner_key(tipKey), rho) exists<br/>2. tip not already claimed<br/>then mark claimed
  V->>W: 5 NIGHT out
```

The sender knows `rho` but not Alice's `tipKey`, so the sender cannot claim the tip back.

### Flow 4: claim links and scratch cards

```mermaid
sequenceDiagram
  autonumber
  actor B as Bob
  participant App as Hushh app
  participant V as hushh_vault
  actor C as Anyone with the link

  B->>App: Pay @newfriend (no passport) or create a scratch card
  App->>App: linkSecret = random 32 bytes<br/>tipKey, box key = derive(linkSecret)
  App->>V: deposit(commitment, amount, note sealed to link box key)
  App-->>B: /c?p=... link with card design + linkSecret
  B-->>C: share link (DM, X, email)
  C->>App: open link, scratch the card
  App->>V: scan inbox with link box key, find the tip
  App->>V: claim(C's wallet) proving (link tipKey, rho)
  V-->>C: NIGHT out
```

Scratch cards sent to an existing passport carry only the tip's commitment in the link (no secret): only that passport can claim them.

### On-chain state

```mermaid
erDiagram
  NIGHT_REGISTRY ||--o{ NAME_RECORD : "names"
  NIGHT_REGISTRY ||--o{ SOCIAL_LINK : "socials"
  NIGHT_REGISTRY ||--o{ EMAIL_LINK : "emails"
  HUSHH_VAULT ||--o{ TIP : "tips"
  HUSHH_VAULT ||--o{ INBOX_ENTRY : "inbox"
  NIGHT_REGISTRY {
    JubjubPoint attester "sealed at deploy"
    Uint64 name_count
  }
  NAME_RECORD {
    Bytes32 name PK
    Field owner "name_owner_key(nameSecret)"
    Field tip_pk "owner_key(tipKey)"
    Bytes32 enc_pk "X25519"
    Bytes32 social "x:handle or empty"
    Bytes32 email "sha256 of email, or empty"
  }
  SOCIAL_LINK {
    Bytes32 social PK
    Bytes32 name
  }
  EMAIL_LINK {
    Bytes32 email_hash PK
    Bytes32 name
  }
  HUSHH_VAULT {
    Uint64 tip_count
    Uint128 vault_balance
  }
  TIP {
    Field commitment PK
    Uint64 amount
    Boolean claimed
  }
  INBOX_ENTRY {
    Uint64 index PK
    Field commitment
    Bytes120 sealed_note "epk + nonce + box"
  }
```

### Tip lifecycle

```mermaid
stateDiagram-v2
  [*] --> Sealed: deposit()
  Sealed --> Found: recipient scans inbox
  Found --> Claimed: claim() with ZK proof
  Sealed --> Claimed: claim link holder claims
  Claimed --> [*]
  Claimed --> Claimed: second claim rejected
```

### What each circuit enforces

| Circuit | Private witness | Checks | Public effect |
|---------|-----------------|--------|---------------|
| `register_name` | `nameSecret` | name not empty, not taken | new `.night` record |
| `update_keys` | `nameSecret` | caller owns the name | rotate `tip_pk` / `enc_pk` |
| `link_social` | `nameSecret` | owns the name; Jubjub signature from the sealed attester over `(social, name)` | `socials[x:handle] = name`, previous holder unlinked |
| `unlink_social` | `nameSecret` | owns the name, has a link | link removed |
| `link_email` | `nameSecret` | owns the name; attester signature over `(email_hash, name)` with its own tag, so an X attestation cannot be replayed | `emails[sha256(email)] = name`, previous holder unlinked; X link untouched |
| `unlink_email` | `nameSecret` | owns the name, has an email | email link removed |
| `deposit` | none | amount > 0, commitment unused | NIGHT in, tip + inbox entry stored |
| `claim` | `tipKey`, `rho` | commitment for `owner_key(tipKey), rho` exists; not claimed | tip marked claimed, NIGHT to recipient wallet |

| Contract | Circuits | Largest prover key |
|----------|----------|--------------------|
| `night_registry` | `register_name`, `update_keys`, `link_social`, `unlink_social`, `link_email`, `unlink_email` | 4.2 MB (`link_social` / `link_email`, Jubjub Schnorr) |
| `hushh_vault` | `deposit`, `claim` | 0.9 MB |

## Repo layout

```
midnight/                Compact contracts, shared SDK, tests, localnet
  contracts/             hushh_vault.compact, night_registry.compact
  src/sdk/               keys, notes (seal/scan), attestation, witnesses, clients
  src/node/              deploy + end-to-end script (real proofs on localnet)
  test/                  simulator tests (vitest)
  infra/                 Docker compose: node 2.1.101, indexer 4.4.101, proof server 9.0.2
frontend/                Next.js 15 app (UI unchanged, Midnight data layer)
  src/lib/midnight/      config, wallet backends, passkey, passport, store, hooks
  src/app/api/social/attest/route.ts   X + email attester
```

## Run it locally

Requirements: Node 22+, pnpm, Docker, Compact toolchain 0.36.1 (`compact update 0.36.1`).

```bash
# 1. contracts + localnet
cd midnight
npm install
npm run compile          # compact 0.36.1, language 0.28.0
npm test                 # 19 simulator tests
npm run localnet:up      # node + indexer + proof server
npm run deploy           # writes deployments/local.json and .secrets/attester-local.json
npm run test:e2e         # register, link X, tip, claim, claim link — real proofs

# 2. app
cd ../frontend
pnpm install
cp .env.example .env.local   # localnet: add ATTESTER_DEV_MODE=1 if you have no Privy app
pnpm dev                     # http://localhost:3000 (use localhost, not 127.0.0.1, for passkeys)
```

On localnet the app runs the genesis wallet inside the page and pays all fees, so you need no wallet extension. Add `?passport=passphrase` to use a passphrase instead of a passkey (browsers without WebAuthn PRF, automated tests).

## Preprod (not done yet)

The frontend's connector mode is written for preview/preprod, but nothing has been deployed or tested there.

1. Deploy: `midnight/src/node/wallet.ts` only has a localnet config today. Add a preprod entry (Blockfrost indexer + node with a `project_id`, a proof server) and deploy from a wallet holding tNIGHT and DUST, or deploy from the browser through 1AM.
2. Set `NEXT_PUBLIC_MIDNIGHT_NETWORK=preprod` and the contract addresses (or a `deployments/preprod.json`).
3. Users connect 1AM or Lace; the wallet proves and pays DUST.
4. Set `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `ATTESTER_SECRET` (the key the registry was deployed with). Never set `ATTESTER_DEV_MODE` outside localnet.

## Toolchain

Ledger 9.1 set: `compact` 0.36.1 · `compact-runtime` 0.21.0 · `midnight-js` 5.0.2 · `ledger-v9` 1.0.2 · Wallet SDK 2.0.1 · DApp Connector 4.1.0.
# midnight-hushhprotocol
