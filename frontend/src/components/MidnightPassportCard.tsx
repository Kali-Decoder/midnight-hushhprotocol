"use client";

// The profile's identity card: a Midnight Passport showing what the .night
// name is bound to on-chain (passkey, X, email). Reads only public registry
// data plus how this browser unlocks the passport.

import Image from "next/image";
import {useRef, type ReactNode} from "react";
import type {PublicUser} from "@/shared";
import {UserAvatar} from "@/components/UserAvatar";
import {MailIcon, ShieldCheckIcon, XBrandIcon} from "@/components/icons";
import {NETWORK_NAME} from "@/lib/config";
import {shortAddr} from "@/lib/address";

function passportNumber(tipPk?: string): string {
  if (!tipPk) return "HP-········";
  const hex = BigInt(tipPk).toString(16).padStart(64, "0").toUpperCase();
  return `HP-${hex.slice(-8, -4)}-${hex.slice(-4)}`;
}

/** Machine-readable zone, passport style: fixed width, "<" as filler. */
function mrz(parts: string[], width = 36): string {
  const s = parts.join("<").toUpperCase().replace(/[^A-Z0-9<]/g, "<");
  return (s + "<".repeat(width)).slice(0, width);
}

function Credential({
  icon,
  label,
  value,
  linked,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  linked: boolean;
}) {
  return (
    <div
      className={`passport-cred group/cred relative min-w-0 rounded-2xl border px-3 py-2.5 transition-colors duration-300 ${
        linked
          ? "border-white/15 bg-white/[0.07]"
          : "border-dashed border-white/15 bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            linked ? "bg-paper text-ink" : "bg-white/10 text-paper/60"
          }`}
        >
          {icon}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${linked ? "bg-signal passport-pulse" : "bg-white/25"}`}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.16em] text-paper/50">
        {label}
      </p>
      <p className={`mt-0.5 truncate text-[13px] font-semibold ${linked ? "text-paper" : "text-paper/45"}`}>
        {value}
      </p>
    </div>
  );
}

export function MidnightPassportCard({
  user,
  method,
  unlocked,
}: {
  user: PublicUser;
  /** How this browser unlocks the passport. */
  method?: "passkey" | "passphrase";
  unlocked: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Gentle tilt + moving sheen that follows the pointer.
  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  const linkedCount = 1 + (user.twitterUsername ? 1 : 0) + (user.emailLinked ? 1 : 0);
  const number = passportNumber(user.tipPk);
  const issued = user.index != null ? `#${String(user.index + 1).padStart(4, "0")}` : "—";

  return (
    <div className="passport-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={ref} className="passport-card relative overflow-hidden rounded-[1.6rem] p-5 text-paper sm:p-6">
        <div className="passport-sheen" aria-hidden />
        <div className="passport-guilloche" aria-hidden />

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/midnight-logo.png"
              alt="Midnight"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg ring-1 ring-white/15"
            />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-paper/90">
                Midnight Passport
              </p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-paper/45">
                Night ID · {NETWORK_NAME}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              unlocked ? "bg-signal/15 text-signal" : "bg-amber/15 text-amber"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${unlocked ? "bg-signal" : "bg-amber"}`} />
            {unlocked ? "Unlocked" : "Locked"}
          </span>
        </div>

        {/* Holder */}
        <div className="relative mt-6 flex items-center gap-4 sm:gap-5">
          <div className="passport-photo shrink-0 origin-left scale-[0.82] rounded-2xl p-1 sm:scale-100">
            <UserAvatar address={user.wallet} size="lg" className="rounded-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-paper/45">Holder</p>
            <p className="truncate text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              {user.username}
              <span className="text-paper/45">.night</span>
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.16em] text-paper/45">No.</p>
                <p className="truncate font-mono text-[12px] text-paper/90">{number}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.16em] text-paper/45">Issued</p>
                <p className="truncate font-mono text-[12px] text-paper/90">{issued}</p>
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-[9px] uppercase tracking-[0.16em] text-paper/45">Wallet</p>
                <p className="truncate font-mono text-[12px] text-paper/90">{shortAddr(user.wallet)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Linked credentials */}
        <div className="relative mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-paper/50">
              Linked to this passport
            </p>
            <p className="font-mono text-[10px] text-paper/50">{linkedCount}/3</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <Credential
              icon={<ShieldCheckIcon className="h-3.5 w-3.5" />}
              label="Passkey"
              value={method === "passphrase" ? "Passphrase" : "Secured"}
              linked
            />
            <Credential
              icon={<XBrandIcon className="h-3 w-3" />}
              label="X"
              value={user.twitterUsername ? `@${user.twitterUsername}` : "Not linked"}
              linked={!!user.twitterUsername}
            />
            <Credential
              icon={<MailIcon className="h-3.5 w-3.5" />}
              label="Email"
              value={user.emailLinked ? "Verified" : "Not linked"}
              linked={!!user.emailLinked}
            />
          </div>
        </div>

        {/* MRZ */}
        <div className="relative mt-5 border-t border-white/10 pt-3 font-mono text-[10px] leading-relaxed tracking-[0.18em] text-paper/35 sm:text-[11px]">
          <p className="truncate">{mrz(["P", "NIGHT", user.username])}</p>
          <p className="truncate">
            {mrz([number.replace(/-/g, ""), user.twitterUsername ? `X${user.twitterUsername}` : "", user.emailLinked ? "EMAIL" : ""])}
          </p>
        </div>
      </div>
    </div>
  );
}
