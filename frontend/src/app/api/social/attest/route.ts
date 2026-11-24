// Social attester: signs "x:<handle> belongs to <name>.night" so the
// night_registry contract will accept the link (it verifies this Jubjub
// Schnorr signature in-circuit against its sealed attester key).
//
// The handle always comes from Privy's record of the user's linked X account,
// never from the request body. Exception: ATTESTER_DEV_MODE=1 (localnet demos
// without a Privy app) trusts the typed handle and must never run in production.
//
// Env: ATTESTER_SECRET (Jubjub scalar, decimal), PRIVY_APP_ID / NEXT_PUBLIC_PRIVY_APP_ID,
//      PRIVY_APP_SECRET, ATTESTER_DEV_MODE.

import {readFileSync} from "node:fs";
import path from "node:path";
import {NextResponse} from "next/server";
import {signAttestation} from "@hushh/sdk/attestation";
import {normalizeName, socialId} from "@hushh/sdk/names";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function attesterSecret(): bigint {
  if (process.env.ATTESTER_SECRET) return BigInt(process.env.ATTESTER_SECRET);
  // Localnet convenience: the key `npm run deploy` generated in ../midnight.
  if ((process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || "undeployed") === "undeployed") {
    const file = path.join(process.cwd(), "..", "midnight", ".secrets", "attester-local.json");
    return BigInt(JSON.parse(readFileSync(file, "utf-8")).secret);
  }
  throw new Error("ATTESTER_SECRET is not set");
}

async function handleFromPrivy(accessToken: string): Promise<string> {
  const appId = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Privy is not configured on the server (PRIVY_APP_SECRET).");
  const {PrivyClient} = await import("@privy-io/node");
  const privy = new PrivyClient({appId, appSecret});
  const claims = await privy.utils().auth().verifyAccessToken(accessToken);
  const user = await privy.users()._get(claims.user_id);
  const x = (user.linked_accounts as Array<{type: string; username?: string | null}>).find(
    (a) => a.type === "twitter_oauth",
  );
  if (!x?.username) throw new Error("No X account is linked to this Privy session.");
  return x.username;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {name?: string; privyAccessToken?: string; handle?: string};
    if (!body.name) return NextResponse.json({error: "name is required"}, {status: 400});
    const name = normalizeName(body.name);

    let handle: string;
    if (body.privyAccessToken) {
      handle = await handleFromPrivy(body.privyAccessToken);
    } else if (process.env.ATTESTER_DEV_MODE === "1" && body.handle) {
      handle = body.handle;
    } else {
      return NextResponse.json(
        {error: "Sign in with X first (or run the attester with ATTESTER_DEV_MODE=1 on localnet)."},
        {status: 401},
      );
    }

    const attestation = signAttestation(attesterSecret(), socialId("x", handle), name);
    return NextResponse.json(attestation);
  } catch (e) {
    return NextResponse.json({error: (e as Error).message || "attestation failed"}, {status: 400});
  }
}
