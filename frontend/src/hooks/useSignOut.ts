"use client";

import {logoutPrivySession} from "@/components/PrivyLogoutBridge";
import {disconnect, lock, remember} from "@/lib/midnight/store";
import {toast} from "@/lib/toast";

/** Sign out: lock the passport, disconnect the wallet, log out of Privy. */
export function useSignOut() {
  return async function signOut(opts?: {
    /** Defaults to home `/`. Pass `null` to stay on the current page. */
    redirect?: string | null;
    silent?: boolean;
    /** Also forget the remembered passport on this device. */
    forget?: boolean;
  }) {
    lock();
    if (opts?.forget) remember(null);
    await disconnect().catch(() => undefined);
    await logoutPrivySession();
    if (!opts?.silent) toast.info("Signed out.");
    if (typeof window === "undefined") return;
    if (opts?.redirect === null) return;
    window.location.href = opts?.redirect ?? "/";
  };
}
