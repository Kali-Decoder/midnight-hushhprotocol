"use client";

import {useEffect, useState} from "react";
import {motion} from "motion/react";
import {usePrivy} from "@privy-io/react-auth";
import {normalizeName} from "@hushh/sdk";
import {useAccount} from "@/lib/midnight/hooks";
import {claimPassport, linkX, signInPassport} from "@/lib/midnight/passport";
import {resolveName} from "@/lib/midnight/store";
import {isReservedPath} from "@/lib/routes";
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
import {ConnectTwitterCard} from "@/components/ConnectTwitterCard";
import {ConnectEmailCard} from "@/components/ConnectEmailCard";
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

type Step = {label: string; hint: string};

const CLAIM_STEPS: Step[] = [
  {label: "Wallet", hint: "Connect your Midnight wallet"},
  {label: "Name", hint: "Pick your .night name"},
  {label: "Passkey", hint: "Secure it with Face ID, Touch ID or Windows Hello"},
];

const SIGNIN_STEPS: Step[] = [
  {label: "Wallet", hint: "Connect your Midnight wallet"},
  {label: "Passkey", hint: "Unlock your passport"},
];

/** "Step 2 of 3" header with a filling bar and labelled dots. */
function AuthSteps({steps, current}: {steps: Step[]; current: number}) {
  const pct = ((current + 1) / steps.length) * 100;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold tracking-tight text-ink">
          {steps[current].hint}
        </p>
        <p className="shrink-0 font-mono text-[11px] text-graphite">
          Step {current + 1} of {steps.length}
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-fog/70">
        <motion.div
          className="h-full rounded-full bg-ink"
          initial={false}
          animate={{width: `${pct}%`}}
          transition={{type: "spring", stiffness: 160, damping: 26}}
        />
      </div>
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.label} className="flex min-w-0 flex-1 items-center gap-2">
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
    </div>
  );
}

type Availability =
  | {state: "idle"}
  | {state: "invalid"; message: string}
  | {state: "checking"}
  | {state: "free"; name: string}
  | {state: "taken"; name: string};

/** Keep only what a .night name allows, as the user types. */
function cleanNameInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\.night$/, "")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 27);
}

/** Debounced check against the on-chain registry (works without a wallet). */
function useNameAvailability(raw: string): Availability {
  const [result, setResult] = useState<Availability>({state: "idle"});
  useEffect(() => {
    if (!raw) {
      setResult({state: "idle"});
      return;
    }
    let name: string;
    try {
      name = normalizeName(raw);
    } catch {
      setResult({
        state: "invalid",
        message: "2–27 characters: letters, numbers, - or _. Start with a letter or number.",
      });
      return;
    }
    if (isReservedPath(name)) {
      setResult({state: "invalid", message: `${name}.night is reserved by the app.`});
      return;
    }
    setResult({state: "checking"});
    let cancelled = false;
    const t = setTimeout(() => {
      resolveName(name)
        .then((rec) => {
          if (!cancelled) setResult(rec ? {state: "taken", name} : {state: "free", name});
        })
        // Couldn't reach the registry: let the claim itself be the check.
        .catch(() => !cancelled && setResult({state: "free", name}));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [raw]);
  return result;
}

/** Optional after claiming: link X and email so people can pay @handle. */
function LinkSocialsNudge({username}: {username: string}) {
  return (
    <div className="space-y-3 rounded-[1.4rem] border border-fog bg-paper/60 p-4">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
          Optional · do it now or later
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">
          Get paid by your X handle or email
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-graphite">
          Link them to {username}.night so people can pay @you without knowing your
          .night name. You can always do this from your profile.
        </p>
      </div>
      <ConnectTwitterCard />
      <ConnectEmailCard />
    </div>
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
  const [nameInput, setNameInput] = useState("");
  const [wantX, setWantX] = useState(false);
  const availability = useNameAvailability(nameInput);

  // Suggest the X handle as the name: when the user asked for it, or the
  // field is still empty and an X session already exists.
  useEffect(() => {
    if (!twitterHandle) return;
    if (wantX || !nameInput) {
      setNameInput(cleanNameInput(twitterHandle));
      setWantX(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twitterHandle, wantX]);

  function fillFromX() {
    if (twitterHandle) setNameInput(cleanNameInput(twitterHandle));
    else {
      setWantX(true);
      login();
    }
  }

  async function signInOrRegister(mode: "signin" | "register") {
    setError("");
    if (!address) {
      toast.info("Connect your wallet first.");
      setError("Connect a wallet first.");
      return;
    }

    const clean =
      mode === "register"
        ? availability.state === "free" || availability.state === "taken"
          ? availability.name
          : ""
        : (user?.username || knownUsername).trim().toLowerCase().replace(/^@/, "");

    if (mode === "register" && !clean) {
      const msg =
        availability.state === "invalid" ? availability.message : "Pick a .night name first.";
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
      // X is optional. If an X session exists, link it on-chain with an
      // attestation (best effort: the name is already yours if this fails,
      // retry from the profile).
      let xLinked = !!claimed.profile.social;
      if (!xLinked && twitterHandle) {
        try {
          const accessToken = x.devMode ? null : await x.getAccessToken();
          await linkX(x.devMode ? {handle: twitterHandle} : {privyAccessToken: accessToken ?? undefined});
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
              {user.username}.night is yours, owned by your passkey on Midnight. No seed phrase.
            </p>
          ) : null}
        </div>
        {/* Not while a claim is still finishing: it may be linking X itself. */}
        {!busy && (!user.twitterUsername || !user.emailLinked) ? (
          <LinkSocialsNudge username={user.username} />
        ) : null}
        <NetworkGate>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={`/${encodeURIComponent(user.username)}`} className="btn-primary">
              View profile
            </a>
            <a href="/send" className="btn-ghost">
              Send your first payment
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

  const steps = hasClaimedUsername ? SIGNIN_STEPS : CLAIM_STEPS;
  const current = !isConnected ? 0 : hasClaimedUsername ? 1 : busy ? 2 : 1;

  return (
    <Panel className="space-y-5 text-left">
      <AuthSteps steps={steps} current={current} />

      {!isConnected ? (
        <div className="space-y-4 py-1 text-center">
          <p className="text-sm leading-relaxed text-graphite">
            Three quick steps: connect a wallet, pick a .night name, and
            secure it with a passkey. Linking X or email is optional.
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
                  <div className="space-y-2">
                    <div className="flex items-end justify-between gap-3">
                      <label htmlFor="night-name" className="text-xs font-medium text-graphite">
                        Your .night name
                      </label>
                      <button
                        type="button"
                        disabled={!privyReady || busy}
                        onClick={fillFromX}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        <XBrandIcon className="h-3 w-3" />
                        {twitterHandle ? `Use @${twitterHandle}` : "Use my X handle"}
                      </button>
                    </div>
                    <div
                      className={`flex items-center rounded-[1.4rem] border bg-white px-4 py-3 transition-colors focus-within:border-ink ${
                        availability.state === "invalid"
                          ? "border-amber/60"
                          : availability.state === "taken"
                            ? "border-red-400"
                            : "border-fog"
                      }`}
                    >
                      <input
                        id="night-name"
                        value={nameInput}
                        onChange={(e) => setNameInput(cleanNameInput(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !busy) void signInOrRegister("register");
                        }}
                        disabled={busy}
                        placeholder="yourname"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="min-w-0 flex-1 bg-transparent text-2xl font-bold tracking-tight text-ink outline-none placeholder:text-fog"
                      />
                      <span className="shrink-0 text-lg font-semibold text-graphite">.night</span>
                    </div>
                    <p
                      aria-live="polite"
                      className={`min-h-[1.25rem] text-xs ${
                        availability.state === "free"
                          ? "text-signal"
                          : availability.state === "taken"
                            ? "font-semibold text-red-600"
                            : availability.state === "invalid"
                              ? "text-amber"
                              : "text-graphite"
                      }`}
                    >
                      {availability.state === "idle"
                        ? "Anything you like. People can send NIGHT to this name."
                        : availability.state === "checking"
                          ? "Checking…"
                          : availability.state === "free"
                            ? `✓ ${availability.name}.night is available`
                            : availability.state === "taken"
                              ? `${availability.name}.night is taken. If it's yours, continue to sign in with your passkey.`
                              : availability.message}
                    </p>
                  </div>
                  <p className="text-sm text-graphite">
                    Next, your device asks for Face ID, Touch ID or Windows Hello.
                    That passkey is your passport: no seed phrase.
                  </p>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      availability.state === "idle" ||
                      availability.state === "invalid" ||
                      availability.state === "checking"
                    }
                    onClick={() => signInOrRegister("register")}
                    className="btn-primary"
                  >
                    {busy ? <LoaderIcon className="h-5 w-5 animate-spin" /> : null}
                    {busy
                      ? "Proving on Midnight…"
                      : availability.state === "taken"
                        ? `Sign in as ${availability.name}.night`
                        : availability.state === "free"
                          ? `Claim ${availability.name}.night`
                          : "Claim name"}
                  </button>
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
