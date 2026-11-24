"use client";

import {useMemo} from "react";
import {toPublicUser} from "@/lib/api";
import {useMidnight} from "@/lib/midnight/hooks";
import type {PublicUser} from "@/shared";

/**
 * Passport session.
 *   hasProfile    this browser remembers a passport (name) → offer "Sign in"
 *   isSignedIn    passport unlocked (passkey) AND its .night name is on-chain
 *   needsUsername unlocked but no .night name registered yet
 */
export function useSession() {
  const s = useMidnight();
  const address = s.wallet?.address;

  const user: PublicUser | null = useMemo(() => {
    if (s.profile) return toPublicUser(s.profile, address ?? undefined);
    if (s.remembered?.name) {
      return {
        id: s.remembered.name,
        wallet: address ?? "",
        username: s.remembered.name,
        bulletPublicKey: "",
        twitterUsername: null,
      };
    }
    return null;
  }, [s.profile, s.remembered, address]);

  const unlocked = !!s.keys;
  const isSignedIn = unlocked && !!s.profile;
  const hasProfile = !!s.profile || !!s.remembered?.name;
  const needsUsername = unlocked && !s.profile;
  const needsSignature = hasProfile && !unlocked;

  return {
    user,
    keys: s.keys,
    profile: s.profile,
    remembered: s.remembered,
    /** Kept for components that read it; there are no JWTs any more. */
    token: unlocked ? "passport" : null,
    lookup: user ? {wallet: address ?? "", username: s.profile?.name ?? s.remembered?.name ?? null} : null,
    ready: s.ready,
    unlocked,
    isSignedIn,
    hasProfile,
    needsUsername,
    needsSignature,
    showPendingDot: needsSignature || needsUsername,
    hasCachedSignature: false,
  };
}
