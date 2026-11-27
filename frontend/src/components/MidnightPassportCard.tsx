"use client";

// The profile's identity card: a Midnight Passport showing what the .night
// name is bound to on-chain (passkey, X, email). Reads only public registry
// data plus how this browser unlocks the passport.

import Image from "next/image";
import {useRef, useState, type ReactNode} from "react";
import type {PublicUser} from "@/shared";
import {UserAvatar} from "@/components/UserAvatar";
import {CheckIcon, CopyIcon, MailIcon, ShieldCheckIcon, XBrandIcon} from "@/components/icons";
import {NETWORK_NAME} from "@/lib/config";
import {shortAddr} from "@/lib/address";
import {passportNumber, copyPassportImage, sharePassportOnX} from "@/lib/sharePassport";
import {toast} from "@/lib/toast";


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
      className={`passport-cred group/cred relative min-w-0 rounded-[1.4rem] border px-3 py-2.5 transition-colors duration-300 ${
        linked
          ? "border-fog bg-white shadow-[0_10px_24px_-20px_rgba(10,10,10,0.35)]"
          : "border-dashed border-fog bg-paper/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            linked ? "bg-ink text-paper" : "bg-fog/70 text-graphite"
          }`}
        >
          {icon}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${linked ? "bg-signal passport-pulse" : "bg-fog"}`}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.16em] text-graphite">
        {label}
      </p>
      <p className={`mt-0.5 truncate text-[13px] font-semibold ${linked ? "text-ink" : "text-graphite/70"}`}>
        {value}
      </p>
    </div>
  );
}

export function MidnightPassportCard({
  user,
  method,
  unlocked,
  shareable = false,
}: {
  user: PublicUser;
  /** Show "Copy card" / "Share on X" under the card (profile only). */
  shareable?: boolean;
  /** How this browser unlocks the passport. */
  method?: "passkey" | "passphrase";
  unlocked: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onCopy() {
    setBusy(true);
    try {
      await copyPassportImage(user, {network: NETWORK_NAME});
      setCopied(true);
      toast.success("Passport card copied. Paste it anywhere.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Your browser blocked image copy. Use Share on X to download it instead.");
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    setBusy(true);
    try {
      const mode = await sharePassportOnX(user, {network: NETWORK_NAME});
      toast.success(
        mode === "copied"
          ? "Card copied. Paste it into your post on X (Cmd/Ctrl + V)."
          : "Card downloaded. Attach it to your post on X.",
      );
    } catch {
      toast.error("Could not prepare the card. Try again.");
    } finally {
      setBusy(false);
    }
  }

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
    <div>
    <div className="passport-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={ref} className="passport-card relative overflow-hidden rounded-[1.6rem] p-5 text-ink sm:p-6">
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
              className="h-8 w-8 rounded-lg ring-1 ring-ink/10"
            />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ink">
                Midnight Passport
              </p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-graphite">
                Night ID · {NETWORK_NAME}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              unlocked ? "bg-signal/10 text-signal ring-1 ring-signal/20" : "bg-amber/15 text-[#9a7420] ring-1 ring-amber/30"
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
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-graphite">Holder</p>
            <p className="truncate text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              {user.username}
              <span className="text-graphite">.night</span>
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.16em] text-graphite">No.</p>
                <p className="truncate font-mono text-[12px] text-ink">{number}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.16em] text-graphite">Issued</p>
                <p className="truncate font-mono text-[12px] text-ink">{issued}</p>
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-[9px] uppercase tracking-[0.16em] text-graphite">Wallet</p>
                <p className="truncate font-mono text-[12px] text-ink">{shortAddr(user.wallet)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Linked credentials */}
        <div className="relative mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-graphite">
              Linked to this passport
            </p>
            <p className="font-mono text-[10px] text-graphite">{linkedCount}/3</p>
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
        <div className="relative mt-5 border-t border-fog pt-3 font-mono text-[10px] leading-relaxed tracking-[0.18em] text-graphite/60 sm:text-[11px]">
          <p className="truncate">{mrz(["P", "NIGHT", user.username])}</p>
          <p className="truncate">
            {mrz([number.replace(/-/g, ""), user.twitterUsername ? `X${user.twitterUsername}` : "", user.emailLinked ? "EMAIL" : ""])}
          </p>
        </div>
      </div>
    </div>
    {shareable ? (
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onCopy()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-fog bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-graphite disabled:opacity-50"
        >
          {copied ? <CheckIcon className="h-4 w-4 text-signal" /> : <CopyIcon className="h-4 w-4" />}
          {copied ? "Copied" : "Copy card"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onShare()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper shadow-[0_8px_20px_-12px_rgba(10,10,10,0.45)] transition-all duration-200 hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
        >
          <XBrandIcon className="h-3.5 w-3.5" />
          Share on X
        </button>
      </div>
    ) : null}
    </div>
  );
}
