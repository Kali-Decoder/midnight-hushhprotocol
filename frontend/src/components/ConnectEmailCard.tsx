"use client";

// Same card as ConnectTwitterCard, for a verified email. Privy checks the
// address with a one-time code; the attester signs it; the registry stores
// only a hash of it next to the X handle.

import {useCallback, useEffect, useRef, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {unlinkEmailAddress} from "@/lib/api";
import {linkEmail} from "@/lib/midnight/passport";
import {toast} from "@/lib/toast";
import {celebrateUsernameClaim} from "@/lib/celebrate";
import {formatError} from "@/lib/errors";
import {useSession} from "@/hooks/useSession";
import {LoaderIcon, MailIcon} from "@/components/icons";

type EmailSource = {
  ready: boolean;
  /** OTP-verified email on the Privy session, if any. */
  email: string | null;
  /** Start verification: log in with email, or add email to the X session. */
  verify: () => void;
  getAccessToken: () => Promise<string | null>;
  devMode: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ConnectEmailCardInner({className = "", src}: {className?: string; src: EmailSource}) {
  const {user: hushUser, isSignedIn, keys} = useSession();
  const [busy, setBusy] = useState(false);
  const attempted = useRef<string | null>(null);

  const emailLinked = !!hushUser?.emailLinked;

  const syncLink = useCallback(async () => {
    if (!isSignedIn || !keys || emailLinked) return;
    const email = src.email;
    if (!email || attempted.current === email) return;
    attempted.current = email;
    setBusy(true);
    try {
      const token = src.devMode ? null : await src.getAccessToken();
      const r = await linkEmail(src.devMode ? {email} : {privyAccessToken: token ?? undefined});
      toast.success(`Linked ${r.email} to ${hushUser?.username}.night`);
      celebrateUsernameClaim();
    } catch (e) {
      attempted.current = null;
      toast.error(formatError(e));
    } finally {
      setBusy(false);
    }
  }, [isSignedIn, keys, emailLinked, src, hushUser?.username]);

  useEffect(() => {
    if (src.email) void syncLink();
  }, [src.email, syncLink]);

  if (!isSignedIn) {
    return (
      <div
        className={`rounded-2xl border border-fog/80 bg-paper/50 px-4 py-3.5 ${className}`}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
          Email
        </p>
        <p className="mt-1 text-sm text-graphite">
          Link your email to your .night passport. Sign in first.
        </p>
      </div>
    );
  }

  async function onConnect() {
    if (src.email) {
      attempted.current = null;
      await syncLink();
      return;
    }
    src.verify();
  }

  async function onUnlink() {
    if (!keys || !hushUser) return;
    setBusy(true);
    try {
      await unlinkEmailAddress(hushUser.username, keys);
      attempted.current = null;
      toast.info("Email disconnected.");
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border border-fog/80 bg-white px-4 py-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
          <MailIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
            Email
          </p>
          {emailLinked ? (
            <>
              <p className="mt-1 truncate text-lg font-bold tracking-tight text-ink">
                {src.email ?? "Verified email"}
              </p>
              <p className="mt-0.5 text-xs text-graphite">
                {`Linked on-chain to ${hushUser?.username}.night (only a hash is public)`}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm font-semibold text-ink">
                Connect your email
              </p>
              <p className="mt-0.5 text-xs text-graphite">
                Verify your email so people can pay you at your address.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        {!emailLinked ? (
          <button
            type="button"
            disabled={busy || !src.ready}
            onClick={() => void onConnect()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-transform duration-200 hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
          >
            {busy || !src.ready ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <MailIcon className="h-4 w-4" />
            )}
            Connect with email
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onUnlink()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-fog bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-graphite disabled:opacity-50"
          >
            {busy ? <LoaderIcon className="h-4 w-4 animate-spin" /> : null}
            Disconnect email
          </button>
        )}
      </div>
    </div>
  );
}

function WithPrivy({className}: {className: string}) {
  const p = usePrivy();
  const email = p.user?.email?.address?.toLowerCase() ?? null;
  return (
    <ConnectEmailCardInner
      className={className}
      src={{
        ready: p.ready,
        email,
        // Already signed in with X: add the email to the same Privy user.
        verify: () => (p.authenticated ? p.linkEmail() : p.login({loginMethods: ["email"]})),
        getAccessToken: p.getAccessToken,
        devMode: false,
      }}
    />
  );
}

/** Local demo without a Privy app: the attester runs in dev mode. */
function WithoutPrivy({className}: {className: string}) {
  const [email, setEmail] = useState<string | null>(null);
  return (
    <ConnectEmailCardInner
      className={className}
      src={{
        ready: true,
        email,
        verify: () => {
          const e = window.prompt("Demo mode (no Privy app): your email")?.trim().toLowerCase() ?? "";
          if (EMAIL_RE.test(e)) setEmail(e);
          else if (e) toast.error("That is not a valid email.");
        },
        getAccessToken: async () => null,
        devMode: true,
      }}
    />
  );
}

export function ConnectEmailCard({className = ""}: {className?: string}) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) return <WithoutPrivy className={className} />;
  return <WithPrivy className={className} />;
}
