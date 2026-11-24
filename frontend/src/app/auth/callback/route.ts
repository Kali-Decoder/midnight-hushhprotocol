import { NextResponse } from "next/server";

/** Legacy OAuth callback (X sign-in now goes through Privy). Redirects home. */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/register`);
}
