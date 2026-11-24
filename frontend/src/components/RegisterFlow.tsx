"use client";

import {useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useAccount} from "@/lib/midnight/hooks";
import {claimPassport, linkX, signInPassport} from "@/lib/midnight/passport";
import {walletsMatch} from "@/lib/session";
import {
  TWITTER_USERNAME_RE,
  twitterHandleFromPrivyUser,
} from "@/lib/twitter";
import {toast} from "@/lib/toast";
import {celebrateUsernameClaim, celebrateXLinked} from "@/lib/celebrate";
import {useSession} from "@/hooks/useSession";
import {useSignOut} from "@/hooks/useSignOut";
import {ConnectButton} from "@/components/ConnectButton";
import {NetworkGate} from "@/components/NetworkGate";
import {LoaderIcon, CheckIcon, XBrandIcon} from "@/components/icons";
import {ErrorBanner, Panel} from "@/components/ui";
import {formatError, formatErrorTitle} from "@/lib/errors";
import {shortAddr} from "@/lib/address";

/** Where the X handle comes from: Privy OAuth, or (no Privy) a typed handle. */
type XIdentity = {
  ready: boolean;
  handle: string | null;
  login: () => void;
  getAccessToken: () => Promise<string | null>;
  /** True when there is no Privy app: the attester must run in dev mode. */
  devMode: boolean;
};

function AuthSteps({
  step,
  skipTwitter,
}: {
  step: 1 | 2 | 3;
  skipTwitter?: boolean;
}) {
  const steps = skipTwitter
    ? [
        {n: 1 as const, label: "Wallet"},
        {n: 3 as const, label: "Passkey"},
      ]
    : [
        {n: 1 as const, label: "Wallet"},
        {n: 2 as const, label: "Twitter"},
        {n: 3 as const, label: "Passkey"},
      ];

  return (
    <ol className="mb-6 flex items-center gap-2">
      {steps.map((s, i) => {
        const active = step === s.n || (skipTwitter && step === 3 && s.n === 3);
        const done = skipTwitter
          ? s.n === 1 && step >= 3
          : step > s.n;
        return (
          <li key={s.n} className="flex min-w-0 flex-1 items-center gap-2">
            {i > 0 ? <span className="h-px w-3 shrink-0 bg-fog" /> : null}
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium ${
                done || active
                  ? "bg-ink text-paper"
                  : "border border-fog bg-white text-graphite"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`truncate text-xs font-medium ${
                active ? "text-ink" : "text-graphite"
              }`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function RegisterFlowInner({x}: {x: XIdentity}) {
  const {address, isConnected} = useAccount();
  const {user, isSignedIn, ready, remembered, lookup} = useSession();
  const signOut = useSignOut();

  const twitterHandle = x.handle;
  const privyReady = x.ready;
  const login = x.login;
  const lookingUp = false;
  const known = !!remembered?.name;
  const knownUsername = remembered?.name ?? "";
  const hasCachedSignature = remembered?.method === "passkey";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justClaimed, setJustClaimed] = useState(false);

  async function signInOrRegister(mode: "signin" | "register") {
    setError("");
    if (!address) {
      toast.info("Connect your wallet first.");
      setError("Connect a wallet first.");
      return;
    }

    const clean =
      mode === "register"
        ? (twitterHandle || "").trim().toLowerCase().replace(/^@/, "")
        : (user?.username || knownUsername).trim().toLowerCase().replace(/^@/, "");

    if (mode === "register" && !TWITTER_USERNAME_RE.test(clean)) {
      const msg = "Connect Twitter first. Your X handle becomes your .night name.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const {profile, reclaimed} = await signInPassport(clean || undefined);
        if (!profile) {
          throw new Error("This passkey does not own a .night name yet. Claim one with your X handle.");
        }
        if (reclaimed) {
          // Registry was redeployed: the name is back on this passkey. Re-link
          // X right away when the Privy session is for the same handle.
          let xLinked = false;
          if (twitterHandle && twitterHandle === profile.name) {
            try {
              const accessToken = x.devMode ? null : await x.getAccessToken();
              await linkX(x.devMode ? {handle: profile.name} : {privyAccessToken: accessToken ?? undefined});
              xLinked = true;
            } catch (e) {
              console.error("[hushh] re-linking X failed", e);
            }
          }
          toast.success(
            xLinked
              ? `Re-claimed @${profile.name} and linked your X`
              : `Re-claimed @${profile.name}. Link X and email from your profile.`,
          );
          if (xLinked) celebrateXLinked();
          else celebrateUsernameClaim();
          return;
        }
        toast.success(`Welcome back @${profile.name}`);
        return;
      }

      const claimed = await claimPassport(clean);
      // Link the X handle on-chain with an attestation (best effort: the
      // name is already yours if this step fails, retry from the profile).
      let xLinked = claimed.profile.social === `x:${clean}`;
      if (!xLinked) {
        try {
          const accessToken = x.devMode ? null : await x.getAccessToken();
          await linkX(x.devMode ? {handle: clean} : {privyAccessToken: accessToken ?? undefined});
          xLinked = true;
        } catch (e) {
          console.error("[hushh] linking X failed", e);
          toast.error(`Claimed ${claimed.profile.name}.night, but linking X failed: ${formatError(e)}`);
        }
      }
      toast.success(claimed.txId ? `Claimed @${claimed.profile.name}` : `Welcome back @${claimed.profile.name}`);
      setJustClaimed(true);
      // X handle is now the Midnight ID: bigger celebration.
      if (xLinked) celebrateXLinked();
      else celebrateUsernameClaim();
    } catch (e) {
      const msg = formatError(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <Panel className="flex justify-center py-10">
        <LoaderIcon className="h-6 w-6 animate-spin text-graphite" />
      </Panel>
    );
  }

  if (isSignedIn && user && walletsMatch(user.wallet, address ?? user.wallet)) {
    return (
      <Panel className="animate-rise space-y-5 text-left">
        <div className="flex items-center gap-2 text-signal">
          <CheckIcon className="h-5 w-5" />
          <p className="text-sm font-medium text-ink">
            {justClaimed ? "Passport claimed" : "Signed in"}
          </p>
        </div>
        <div>
          <p
            className={`text-3xl font-bold tracking-tight ${
              justClaimed
                ? "animate-amount-pop motion-reduce:animate-none"
                : ""
            }`}
          >
            @{user.username}
          </p>
          <p className="mt-1 font-mono text-xs text-graphite">{user.username}.night</p>
          <p className="mt-2 truncate font-mono text-xs text-graphite" title={user.wallet}>
            {shortAddr(user.wallet)}
          </p>
          {justClaimed ? (
            <p className="mt-2 text-sm text-graphite">
              Your X handle is now your .night name, owned by your passkey on Midnight.
            </p>
          ) : null}
        </div>
        <NetworkGate>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={`/${encodeURIComponent(user.username)}`} className="btn-primary">
              View profile
            </a>
            <a href="/send" className="btn-ghost">
              Send
            </a>
          </div>
        </NetworkGate>
        <button
          type="button"
          onClick={() => signOut({redirect: "/"})}
          className="btn-ghost"
        >
          Sign out
        </button>
      </Panel>
    );
  }

  const hasClaimedUsername =
    known ||
    !!knownUsername ||
    !!user?.username ||
    !!lookup?.username;

  // Existing DB users only sign in — never prompt Twitter again.
  const needsClaim = isConnected && !hasClaimedUsername;

  const step: 1 | 2 | 3 = !isConnected
    ? 1
    : needsClaim && !twitterHandle
      ? 2
      : isConnected
        ? 3
        : 1;

  return (
    <Panel className="space-y-5 text-left">
      <AuthSteps step={step} skipTwitter={hasClaimedUsername} />

      {!isConnected ? (
        <div className="space-y-4 py-1 text-center">
          <p className="text-sm leading-relaxed text-graphite">
            Connect your Midnight wallet, then connect Twitter. Your X handle
            becomes your .night passport name, secured by a passkey.
          </p>
          <ConnectButton label="Connect wallet" />
        </div>
      ) : (
        <NetworkGate>
          {lookingUp ? (
            <div className="flex justify-center py-8">
              <LoaderIcon className="h-6 w-6 animate-spin text-graphite" />
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-paper/80 px-4 py-3">
                <p className="text-xs text-graphite">Wallet connected</p>
                <p className="mt-0.5 truncate font-mono text-xs text-ink" title={address}>
                  {shortAddr(address)}
                </p>
              </div>

              {needsClaim ? (
                <>
                  {!twitterHandle ? (
                    <>
                      <div className="flex items-start gap-3 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3">
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber"
                          aria-hidden
                        />
                        <p className="text-sm text-graphite">
                          Connect Twitter. Your X handle becomes your .night
                          name and is linked to it on-chain.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!privyReady || busy}
                        onClick={() => login()}
                        className="btn-primary"
                      >
                        {!privyReady ? (
                          <LoaderIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          <XBrandIcon className="h-5 w-5" />
                        )}
                        Connect with Twitter
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-fog bg-white px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
                            <XBrandIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
                              Claiming as
                            </p>
                            <p className="mt-0.5 text-2xl font-bold tracking-tight text-ink">
                              @{twitterHandle}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-graphite">
                        Create a passkey to claim {twitterHandle}.night. No seed
                        phrase: your passkey is your passport.
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => signInOrRegister("register")}
                        className="btn-primary"
                      >
                        {busy ? (
                          <LoaderIcon className="h-5 w-5 animate-spin" />
                        ) : null}
                        {busy
                          ? "Proving on Midnight…"
                          : `Sign and claim @${twitterHandle}`}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-graphite">Account found</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">
                      @{(user?.username || knownUsername).replace(/^@/, "")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500"
                      aria-hidden
                    />
                    <p className="text-sm text-graphite">
                      {hasCachedSignature
                        ? "Unlock your passport with your passkey to finish signing in."
                        : "Enter your passphrase to unlock your passport."}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => signInOrRegister("signin")}
                    className="btn-primary"
                  >
                    {busy ? (
                      <LoaderIcon className="h-5 w-5 animate-spin" />
                    ) : null}
                    {busy
                      ? "Signing in…"
                      : "Sign in with passkey"}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => signOut({silent: true, redirect: null})}
                className="w-full text-center text-sm text-graphite hover:text-ink"
              >
                Disconnect wallet
              </button>
            </>
          )}
        </NetworkGate>
      )}

      {error ? (
        <ErrorBanner title={formatErrorTitle(error)} message={error} />
      ) : null}
    </Panel>
  );
}

function RegisterFlowWithPrivy() {
  const {ready, user, login, getAccessToken} = usePrivy();
  return (
    <RegisterFlowInner
      x={{
        ready,
        handle: twitterHandleFromPrivyUser(user),
        login: () => login({loginMethods: ["twitter"]}),
        getAccessToken,
        devMode: false,
      }}
    />
  );
}

/** No Privy app configured (local demo): the X handle is typed in and the
 *  attester must run with ATTESTER_DEV_MODE=1. */
function RegisterFlowDev() {
  const [handle, setHandle] = useState<string | null>(null);
  return (
    <RegisterFlowInner
      x={{
        ready: true,
        handle,
        login: () => {
          const h = window.prompt("Demo mode (no Privy app): your X handle");
          const clean = h?.trim().toLowerCase().replace(/^@/, "") ?? "";
          if (TWITTER_USERNAME_RE.test(clean)) setHandle(clean);
          else if (h) toast.error("That is not a valid X handle.");
        },
        getAccessToken: async () => null,
        devMode: true,
      }}
    />
  );
}

export function RegisterFlow() {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) return <RegisterFlowDev />;
  return <RegisterFlowWithPrivy />;
}
