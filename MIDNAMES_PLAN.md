# Plan: move Hushh's `.night` names to Midnames

**Status:** planned, not started. Nothing in the app has changed.
**Network:** Midnight Preprod.
**Last checked:** 2026-11-27 against `@midnames/sdk@2.1.0`.

## Why

Hushh runs its own `.night` registry (`night_registry`). Midnames runs the shared `.night` namespace on Midnight. With two registries, `max.night` in Hushh and `max.night` on Midnames can belong to different people, so a sender could pay the wrong person. The goal is to read names from Midnames and keep only Hushh-specific data (payment keys and verified X/email links) in our own contract. The vault and the private send/claim flow stay as they are.

## What we verified (2026-11-27)

| Check | Result |
|---|---|
| Midnames Preprod contract | `0e6ff3e64e69fcaf513c13f4f66bfe66ab233e554d5c9fef4f2b16795df2e398`. It resolves `mid.night` (owner key, owner wallet address, shielded target). |
| SDK default Preprod indexer (`indexer.preprod.midnight.network/api/v3` and `/v4`) | **Retired: HTTP 410.** Reads only work when the SDK is pointed at our Blockfrost indexer (`NEXT_PUBLIC_MIDNIGHT_INDEXER_URL` / `_WS_URL`). |
| Writes (register a name, set fields) | **Paused.** Every SDK write returns `WritesUnavailableError` ("changes to domains are paused while Midnames moves to the upgraded Midnight network"). The public docs don't mention this yet. |
| Size of the Midnames Preprod registry | 14 names, 13 owner addresses. `max.night` does not exist there. Most Hushh users don't have a Midnames name and can't get one right now. |
| Network default | The SDK defaults to **mainnet**. You must call `setNetworkId("preprod")` and pass a Preprod provider. |
| Dependencies | The SDK uses `@midnight-ntwrk/*@5.0.0` (old package scope). Hushh uses `@midnightntwrk/*@5.0.2`. Keep Midnames reads in their own module so the two sets don't collide. |
| Wallet ownership proof | The 1AM DApp connector API (4.1.0) has `signData(data, {encoding, keyType: "unshielded"})`. Whether 1AM implements it is untested. |
| Subdomains | Enabled on Preprod (`ENABLE_SUBDOMAINS = true`). There is no field limit. |

Working setup for reads:

```ts
import {setNetworkId, createDefaultProvider, getNetworkConfig, getDomainInfo} from "@midnames/sdk";

setNetworkId("preprod");
const provider = createDefaultProvider({
  networkId: "preprod",
  indexerUrl: process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL,     // Blockfrost; the default URL is retired
  indexerWsUrl: process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_WS_URL,
});
const contractAddress = process.env.MIDNAMES_CONTRACT_ADDRESS ?? getNetworkConfig("preprod").contractAddress;

const r = await getDomainInfo("mid.night", {provider, contractAddress});
// r.success ? r.data.ownerAddress : r.error.name === "DomainNotFoundError" ? null : throw
```

## Target design

- **Midnames:** the source of truth for who owns a `.night` name. We only read from it for now.
- **`hushh_directory`** (new; replaces `night_registry`) stores:
  - a **profile** per name: the Hushh payment key, the owner wallet address at bind time, and the source (1 = Midnames name, 2 = Hushh-native name);
  - **links**: X account id or email commitment → name.
- **Hushh verifier:** already checks X OAuth and email codes. It would also check Midnames ownership: the wallet signs a challenge, and the verifier re-reads `getDomainInfo`.
- **`hushh_vault`:** unchanged.

### Rules

1. **Midnames owner wins.** A user can't claim a Hushh name that already exists on Midnames under someone else. If someone later registers a Hushh-native name on Midnames, the native profile goes stale.
2. **Owner freshness on every send.** For Midnames names, the current `ownerAddress` must match the address stored in the profile. If it doesn't, block the send and explain why.
3. **No profile, no send.** Never fall back to paying a plain wallet address.
4. **Read errors are not "not found".** Show a retry message and never fall through to another lookup.
5. **Emails stay private.** Store an HMAC commitment with a server-side pepper, not a plain hash.
6. **Always normalize names** (`normalizeDomain`) before hashing or looking them up.

## Phases

| Phase | Work | Needs |
|---|---|---|
| 0. Read-only guard | Block claiming a Hushh name that exists on Midnames under another owner. Show a "Midnames verified" badge when they match. No new contract. | Nothing |
| 1. Directory contract | Write `hushh_directory.compact`: profiles, links, native names. Compile and test it, add a Midnames resolver to the SDK, add freshness checks to send. | Deploy from `/deploy` with 1AM. Users re-claim their names. |
| 2. Ownership binding | Wallet `signData` challenge, verified by the verifier, then `bind_profile`. Add a "pick your Midnames name" screen (from `addr_to_domains`). | 1AM must support `signData` |
| 3. Migration | Read the directory first, then `night_registry`. Migrate users: Midnames-owned → source 1, free → native, taken → choose a new name. | — |
| 4. Native → Midnames | When Midnames writes reopen, offer "Register on Midnames" and re-bind as source 1. | Midnames writes back |

## Open decisions

1. **Native names:** keep a fallback while Midnames writes are paused, or require a Midnames name? With the registry this small, requiring one would stop new signups.
2. **Who authorizes directory writes:** the user's passkey owns their profile (as today), with the verifier only signing Midnames bindings and social links; or the verifier signs every write?
3. **Questions for the Midnames team:**
   - When will writes reopen?
   - Will the Preprod contract address change after their network migration?
   - Can Hushh run `hushh.night` and issue free subdomains (`beo.hushh.night`)?

## Not in scope

- Changes to the vault circuits.
- Payment references for merchants (for example, API credits for Nightgate). Payments hide the sender, so this needs its own spec.
