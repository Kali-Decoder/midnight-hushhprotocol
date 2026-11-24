"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {unlinkTwitter} from "@/lib/api";
import {linkX} from "@/lib/midnight/passport";
import {toast} from "@/lib/toast";
import {celebrateXLinked} from "@/lib/celebrate";
import {formatError} from "@/lib/errors";
import {useSession} from "@/hooks/useSession";
import {TWITTER_USERNAME_RE, twitterHandleFromPrivyUser} from "@/lib/twitter";
import {LoaderIcon, XBrandIcon} from "@/components/icons";
import {shortAddr} from "@/lib/address";

type XSource = {
  ready: boolean;
  authenticated: boolean;
  handle: string | null;
  login: () => void;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  devMode: boolean;
};

function ConnectTwitterCardInner({className = "", x}: {className?: string; x: XSource}) {
  const {user: hushUser, isSignedIn, keys} = useSession();
  const {ready, authenticated, login, logout} = x;
  const [busy, setBusy] = useState(false);
  const attempted = useRef<string | null>(null);

  const linkedHandle = hushUser?.twitterUsername ?? null;
  const twitterLinkedOnServer = !!hushUser?.twitterUsername;
  // The X handle is linked on-chain: offer disconnect, never connect again.
  const alreadyClaimedOnHushh = twitterLinkedOnServer;

  const syncLink = useCallback(async () => {
    if (!isSignedIn || !keys || twitterLinkedOnServer) return;
    const handle = x.handle;
    if (!handle || attempted.current === handle) return;
    attempted.current = handle;
    setBusy(true);
    try {
      const token = x.devMode ? null : await x.getAccessToken();
      const r = await linkX(x.devMode ? {handle} : {privyAccessToken: token ?? undefined});
      toast.success(`Linked @${r.handle} to ${hushUser?.username}.night`);
      celebrateXLinked();
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setBusy(false);
    }
  }, [isSignedIn, keys, twitterLinkedOnServer, x, hushUser?.username]);

  useEffect(() => {
    if (authenticated) void syncLink();
  }, [authenticated, syncLink]);

  if (!isSignedIn) {
    return (
      <div
        className={`rounded-2xl border border-fog/80 bg-paper/50 px-4 py-3.5 ${className}`}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
          Twitter
        </p>
        <p className="mt-1 text-sm text-graphite">
          Link your X handle to your .night passport. Sign in first.
        </p>
      </div>
    );
  }

  async function onConnect() {
    setBusy(true);
    try {
      if (!authenticated) {
        login();
        return;
      }
      await syncLink();
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  async function onUnlink() {
    if (!keys || !hushUser) return;
    setBusy(true);
    try {
      await unlinkTwitter(hushUser.username, keys);
      attempted.current = null;
      if (authenticated) await logout();
      toast.info("Twitter disconnected.");
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  const claimedViaTwitter = alreadyClaimedOnHushh;

  return (
    <div
      className={`rounded-2xl border border-fog/80 bg-white px-4 py-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
          <XBrandIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
            Twitter
          </p>
          {linkedHandle ? (
            <>
              <p className="mt-1 text-lg font-bold tracking-tight text-ink">
                @{linkedHandle}
              </p>
              <p className="mt-0.5 text-xs text-graphite">
                {claimedViaTwitter
                  ? `Linked on-chain to ${hushUser?.username}.night`
                  : `Linked to ${shortAddr(hushUser?.wallet)}`}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm font-semibold text-ink">
                Connect your Twitter
              </p>
              <p className="mt-0.5 text-xs text-graphite">
                Prove your X account so people can pay you at @handle.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Only offer connect/disconnect when username is not already claimed. */}
      {!alreadyClaimedOnHushh ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={busy || !ready}
            onClick={() => void onConnect()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-transform duration-200 hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
          >
            {busy || !ready ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <XBrandIcon className="h-4 w-4" />
            )}
            Connect with Twitter
          </button>
        </div>
      ) : twitterLinkedOnServer ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={busy || !ready}
            onClick={() => void onUnlink()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-fog bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-graphite disabled:opacity-50"
          >
            {busy ? <LoaderIcon className="h-4 w-4 animate-spin" /> : null}
            Disconnect Twitter
          </button>
        </div>
      ) : null}
    </div>
  );
}

function WithPrivy({className}: {className: string}) {
  const p = usePrivy();
  return (
    <ConnectTwitterCardInner
      className={className}
      x={{
        ready: p.ready,
        authenticated: p.authenticated,
        handle: twitterHandleFromPrivyUser(p.user),
        login: () => p.login({loginMethods: ["twitter"]}),
        logout: p.logout,
        getAccessToken: p.getAccessToken,
        devMode: false,
      }}
    />
  );
}

/** Local demo without a Privy app: the attester runs in dev mode. */
function WithoutPrivy({className}: {className: string}) {
  const [handle, setHandle] = useState<string | null>(null);
  return (
    <ConnectTwitterCardInner
      className={className}
      x={{
        ready: true,
        authenticated: !!handle,
        handle,
        login: () => {
          const h = window.prompt("Demo mode (no Privy app): your X handle");
          const clean = h?.trim().toLowerCase().replace(/^@/, "") ?? "";
          if (TWITTER_USERNAME_RE.test(clean)) setHandle(clean);
          else if (h) toast.error("That is not a valid X handle.");
        },
        logout: async () => setHandle(null),
        getAccessToken: async () => null,
        devMode: true,
      }}
    />
  );
}

export function ConnectTwitterCard({className = ""}: {className?: string}) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) return <WithoutPrivy className={className} />;
  return <WithPrivy className={className} />;
}
