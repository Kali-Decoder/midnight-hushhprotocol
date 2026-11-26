"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {AnimatePresence, motion} from "motion/react";
import type {NameRecord} from "@hushh/sdk";
import {useAccount} from "@/lib/midnight/hooks";
import {resolveName} from "@/lib/midnight/store";
import {listInbox} from "@/lib/api";
import {useSession} from "@/hooks/useSession";
import {profilePath} from "@/lib/routes";
import {CheckIcon, InboxIcon, MailIcon, MinusIcon, XBrandIcon} from "@/components/icons";

const MINIMIZED_KEY = "hushh:setup-dock:minimized";
const INBOX_POLL_MS = 60_000;
const EASE = [0.16, 1, 0.3, 1] as const;

/** Unclaimed payments in the passport's inbox, re-checked every minute. */
function useUnclaimedCount(keys: ReturnType<typeof useSession>["keys"], enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || !keys) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const check = () =>
      listInbox(keys)
        .then((tips) => !cancelled && setCount(tips.filter((t) => !t.claimed).length))
        .catch(() => {});
    void check();
    const id = setInterval(check, INBOX_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [keys, enabled]);
  return count;
}

/**
 * Public registry record for a remembered name, so the checklist can show
 * X / email status before the passport is unlocked (the registry is public).
 */
function useRememberedRecord(name: string | undefined, skip: boolean) {
  const [record, setRecord] = useState<NameRecord | null>(null);
  useEffect(() => {
    if (skip || !name) {
      setRecord(null);
      return;
    }
    let cancelled = false;
    resolveName(name)
      .then((r) => !cancelled && setRecord(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [name, skip]);
  return record;
}

type Item = {
  key: string;
  label: string;
  done: boolean;
  detail: string;
  href: string;
  icon: React.ReactNode;
};

/**
 * Bottom-left setup card: .night name, X and email status, plus unclaimed
 * payments. Minimizes to a round button with an unread badge.
 */
export function SetupDock() {
  const {isConnected} = useAccount();
  const {user, profile, remembered, keys, isSignedIn, ready} = useSession();
  const [minimized, setMinimized] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Restore the last choice; first visit opens on desktop, stays small on phones.
  useEffect(() => {
    const saved = localStorage.getItem(MINIMIZED_KEY);
    setMinimized(saved != null ? saved === "1" : window.innerWidth < 640);
    setHydrated(true);
  }, []);

  function toggle(next: boolean) {
    setMinimized(next);
    localStorage.setItem(MINIMIZED_KEY, next ? "1" : "0");
  }

  const fallback = useRememberedRecord(remembered?.name ?? undefined, !!profile);
  const record = profile ?? fallback;
  const unclaimed = useUnclaimedCount(keys, isSignedIn);

  if (!hydrated || !ready || !isConnected) return null;

  const name = record?.name ?? user?.username;
  const xHandle = record?.social?.startsWith("x:") ? record.social.slice(2) : null;
  const emailLinked = !!record?.emailHash;
  const claimed = !!record;
  // Linking happens on the owner's profile, which needs an unlocked passport.
  const manage = isSignedIn && name ? profilePath(name) : "/register";

  const items: Item[] = [
    {
      key: "name",
      label: ".night name",
      done: claimed,
      detail: claimed ? `${name}.night` : "Not claimed yet",
      href: claimed && name ? profilePath(name) : "/register",
      icon: <span className="font-mono text-[11px] font-bold">.n</span>,
    },
    {
      key: "x",
      label: "X (Twitter)",
      done: !!xHandle,
      detail: xHandle ? `@${xHandle}` : "Not linked",
      href: manage,
      icon: <XBrandIcon className="h-3.5 w-3.5" />,
    },
    {
      key: "email",
      label: "Email",
      done: emailLinked,
      detail: emailLinked ? "Linked" : "Not linked",
      href: manage,
      icon: <MailIcon className="h-3.5 w-3.5" />,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;
  const pending = items.length - doneCount;
  // Badge: unclaimed payments first (they're "unread"), else steps left.
  const badge = unclaimed > 0 ? unclaimed : pending;

  // Nothing to show once everything is set up and the inbox is empty.
  if (allDone && unclaimed === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[90] sm:bottom-6 sm:left-6">
      <AnimatePresence mode="wait" initial={false}>
        {minimized ? (
          <motion.button
            key="pill"
            type="button"
            onClick={() => toggle(false)}
            aria-label={`Open setup: ${doneCount} of ${items.length} done${
              unclaimed ? `, ${unclaimed} unclaimed payment${unclaimed > 1 ? "s" : ""}` : ""
            }`}
            initial={{opacity: 0, scale: 0.85}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.85}}
            transition={{duration: 0.25, ease: EASE}}
            className="pointer-events-auto relative flex h-12 items-center gap-2 rounded-full border border-white/[0.12] bg-ink/90 pl-1.5 pr-4 text-paper shadow-[0_12px_32px_-14px_rgba(10,10,10,0.6)] backdrop-blur-xl transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <ProgressRing value={doneCount / items.length} />
            <span className="text-sm font-semibold tracking-tight">
              {doneCount}/{items.length}
            </span>
            {badge > 0 ? (
              <span
                className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold ring-2 ring-paper ${
                  unclaimed > 0 ? "bg-signal text-white" : "bg-amber text-ink"
                }`}
              >
                {badge}
                {unclaimed > 0 ? (
                  <span className="absolute inset-0 animate-ping rounded-full bg-signal/50 motion-reduce:hidden" />
                ) : null}
              </span>
            ) : null}
          </motion.button>
        ) : (
          <motion.section
            key="card"
            aria-label="Account setup"
            initial={{opacity: 0, y: 16, scale: 0.97}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 16, scale: 0.97}}
            transition={{type: "spring", stiffness: 380, damping: 32}}
            style={{transformOrigin: "bottom left"}}
            className="pointer-events-auto w-[min(18.5rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/[0.12] bg-ink/95 text-paper shadow-[0_24px_60px_-24px_rgba(10,10,10,0.7)] backdrop-blur-xl"
          >
            <header className="flex items-center gap-3 px-4 pb-3 pt-4">
              <ProgressRing value={doneCount / items.length} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight">Your setup</p>
                <p className="text-[11px] text-paper/55">
                  {doneCount} of {items.length} done
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(true)}
                aria-label="Minimize setup card"
                className="flex h-8 w-8 items-center justify-center rounded-full text-paper/60 transition-colors hover:bg-white/10 hover:text-paper"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
            </header>

            <div className="mx-4 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-signal"
                initial={false}
                animate={{width: `${(doneCount / items.length) * 100}%`}}
                transition={{type: "spring", stiffness: 160, damping: 26}}
              />
            </div>

            <ul className="space-y-1 p-2 pt-3">
              {items.map((item, i) => (
                <motion.li
                  key={item.key}
                  initial={{opacity: 0, x: -6}}
                  animate={{opacity: 1, x: 0}}
                  transition={{delay: 0.04 * i, duration: 0.3, ease: EASE}}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors hover:bg-white/[0.06]"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        item.done ? "bg-signal text-white" : "border border-white/15 text-paper/70"
                      }`}
                    >
                      {item.done ? <CheckIcon className="h-3.5 w-3.5" /> : item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold leading-tight">
                        {item.label}
                      </span>
                      <span
                        className={`block truncate text-[11px] ${
                          item.done ? "text-paper/55" : "text-amber"
                        }`}
                      >
                        {item.detail}
                      </span>
                    </span>
                    {!item.done ? (
                      <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink">
                        {item.key === "name" ? "Claim" : "Link"}
                      </span>
                    ) : null}
                  </Link>
                </motion.li>
              ))}

              {unclaimed > 0 ? (
                <li>
                  <Link
                    href="/inbox"
                    className="mt-1 flex items-center gap-3 rounded-2xl bg-signal/15 px-2.5 py-2 transition-colors hover:bg-signal/25"
                  >
                    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-signal text-white">
                      <InboxIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold leading-tight">
                        {unclaimed} unclaimed payment{unclaimed > 1 ? "s" : ""}
                      </span>
                      <span className="block text-[11px] text-paper/60">Open inbox to claim</span>
                    </span>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signal px-1 font-mono text-[10px] font-bold text-white">
                      {unclaimed}
                    </span>
                  </Link>
                </li>
              ) : null}
            </ul>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressRing({value}: {value: number}) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-9 shrink-0 -rotate-90" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
      <motion.circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="#00a676"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={false}
        animate={{strokeDashoffset: c * (1 - value)}}
        transition={{type: "spring", stiffness: 120, damping: 22}}
      />
    </svg>
  );
}
