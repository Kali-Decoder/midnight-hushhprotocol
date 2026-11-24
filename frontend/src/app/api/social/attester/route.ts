// Public key of the social attester (derived from ATTESTER_SECRET). The
// /deploy page passes it to the night_registry constructor.
import {readFileSync} from "node:fs";
import path from "node:path";
import {NextResponse} from "next/server";
import {attesterPublicKey} from "@hushh/sdk/attestation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let secret: bigint;
    if (process.env.ATTESTER_SECRET) secret = BigInt(process.env.ATTESTER_SECRET);
    else if ((process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || "undeployed") === "undeployed") {
      const file = path.join(process.cwd(), "..", "midnight", ".secrets", "attester-local.json");
      secret = BigInt(JSON.parse(readFileSync(file, "utf-8")).secret);
    } else {
      return NextResponse.json({error: "ATTESTER_SECRET is not set on the server."}, {status: 500});
    }
    const pk = attesterPublicKey(secret);
    return NextResponse.json({x: pk.x.toString(), y: pk.y.toString()});
  } catch (e) {
    return NextResponse.json({error: (e as Error).message}, {status: 500});
  }
}
