"use client";

/**
 * Phone screen mocks for the story landing. Static, illustrative UI only:
 * nothing here talks to the chain.
 */

import {animate, useInView} from "motion/react";
import {type ReactNode, useEffect, useRef, useState} from "react";
import {NightCoin} from "@/components/story/MidnightMark";
import {CheckIcon, EyeOffIcon, InboxIcon, LinkIcon, ShieldCheckIcon, XBrandIcon} from "@/components/icons";

export function Phone({children}: {children: ReactNode}) {
  return (
    <div className="hs-phone" aria-hidden>
      <div className="hs-screen">{children}</div>
    </div>
  );
}

function Av({letter, tone}: {letter: string; tone?: "signal" | "amber"}) {
  return <span className={`hs-av ${tone ? `hs-av-${tone}` : ""}`}>{letter}</span>;
}

function Row({
  letter,
  tone,
  title,
  sub,
  amt,
}: {
  letter: ReactNode;
  tone?: "signal" | "amber";
  title: string;
  sub: string;
  amt?: string;
}) {
  return (
    <div className="hs-row">
      {typeof letter === "string" ? <Av letter={letter} tone={tone} /> : letter}
      <div>
        <span className="t">{title}</span>
        <span className="s">{sub}</span>
      </div>
      {amt ? <span className="amt">{amt}</span> : null}
    </div>
  );
}

/** Counts up from `from` to `to` once visible. */
function CountUp({from, to, delay = 0.6}: {from: number; to: number; delay?: number}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, {once: true});
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(to);
      return;
    }
    const c = animate(from, to, {duration: 1.6, delay, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setV(Math.round(x))});
    return () => c.stop();
  }, [inView, from, to, delay]);
  return <span ref={ref}>{v.toLocaleString("en-US")}</span>;
}

/** Hero: Maya's wallet home with a fresh tip. */
export function HomeScreen() {
  return (
    <>
      <div className="hs-top">
        <div className="hs-who">
          <Av letter="M" tone="signal" />
          <div>
            <div className="hs-name">maya.night</div>
            <div className="hs-sub">@maya · linked</div>
          </div>
        </div>
        <div>
          <div className="hs-sub">Balance</div>
          <div className="hs-bal">
            <CountUp from={1215} to={1240} delay={1.4} />
            <small className="hs-unit">
              <NightCoin size={14} /> NIGHT
            </small>
          </div>
        </div>
        <div className="hs-actions">
          <span>
            <i>↑</i>Send
          </span>
          <span>
            <i>↓</i>Claim
          </span>
          <span>
            <i>✦</i>Gift
          </span>
        </div>
      </div>
      <div className="hs-sheet">
        <div className="hs-toast">
          <span className="hs-toast-ic">
            <CheckIcon width={14} height={14} />
          </span>
          <div>
            <b>Tip claimed · +25 NIGHT</b>
            <span>Proof verified on Midnight</span>
          </div>
        </div>
        <div className="hs-screen-title">Recent</div>
        <Row letter="K" title="Sealed tip" sub="from a fan · 2m" amt="+25" />
        <Row letter="J" tone="amber" title="Sealed tip" sub="from a fan · 1h" amt="+10" />
        <Row letter="R" title="Scratch card" sub="claimed · yesterday" amt="+50" />
      </div>
    </>
  );
}

/** 01: the raw-address problem. */
export function AddressScreen() {
  return (
    <div className="hs-sheet hs-sheet-plain">
      <div className="hs-screen-title">Send NIGHT</div>
      <div className="hs-big-q">Paste her wallet address</div>
      <div className="hs-field hs-field-warn">
        <span className="hs-mono">mn_addr_preprod1q8x7k3v0r2…f9w4t6zl0hj5ce2</span>
      </div>
      <div className="hs-warn">One wrong character and it&apos;s gone.</div>
      <div className="hs-field">
        <span>Amount</span>
        <span>25 NIGHT</span>
      </div>
      <div className="hs-note">
        <EyeOffIcon width={14} height={14} /> And it doesn&apos;t say who it is.
      </div>
      <div className="hs-cta-fake is-disabled">Send</div>
    </div>
  );
}

/** 02: claim a .night name with a passkey. */
export function ClaimNameScreen() {
  return (
    <div className="hs-sheet hs-sheet-plain">
      <div className="hs-screen-title">Midnight Passport</div>
      <div className="hs-big-q">Pick your name</div>
      <div className="hs-field">
        <span>
          maya<span style={{color: "var(--color-graphite)"}}>.night</span>
        </span>
        <span className="hs-pill">Available</span>
      </div>
      <div className="hs-tv" style={{marginTop: 4}}>
        <div className="hs-note">
          <ShieldCheckIcon width={14} height={14} /> Passkey · Face ID
        </div>
        <div className="hs-note">
          <CheckIcon width={14} height={14} /> No seed phrase to lose
        </div>
        <div className="hs-note">
          <CheckIcon width={14} height={14} /> Keys never leave this phone
        </div>
      </div>
      <div className="hs-cta-fake">Claim maya.night</div>
    </div>
  );
}

/** 03: bind X handle to the name. */
export function LinkXScreen() {
  return (
    <div className="hs-sheet hs-sheet-plain">
      <div className="hs-screen-title">Link socials</div>
      <div className="hs-big-q">Make @maya point to you</div>
      <div className="hs-bind">
        <div>
          <span className="hs-av" style={{background: "var(--color-ink)", color: "var(--color-paper)"}}>
            <XBrandIcon width={14} height={14} />
          </span>
          @maya
        </div>
        <span style={{fontWeight: 800}}>→</span>
        <div>
          <Av letter="M" tone="signal" />
          maya.night
        </div>
      </div>
      <div className="hs-proof">
        <span>attest(x:maya → maya.night)</span>
        <span>
          sig.check <b>✓ in-circuit</b>
        </span>
      </div>
      <div className="hs-row">
        <span className="hs-pill">Verified</span>
        <div>
          <span className="s">Email linked too · only a hash on-chain</span>
        </div>
      </div>
      <div className="hs-cta-fake">Done</div>
    </div>
  );
}

/** 04: a fan sends to @maya. */
export function SendScreen() {
  return (
    <div className="hs-sheet hs-sheet-plain">
      <div className="hs-screen-title">Send</div>
      <div className="hs-send-to" style={{fontSize: 17}}>
        <Av letter="M" tone="signal" />
        @maya
        <span className="hs-ok">
          <CheckIcon width={12} height={12} />
        </span>
      </div>
      <div className="hs-amt">
        <span className="hs-sub">Amount</span>
        <span className="hs-amt-big" style={{fontSize: 30}}>
          25
          <small className="hs-unit">
            <NightCoin size={14} /> NIGHT
          </small>
        </span>
      </div>
      <div className="hs-field" style={{fontSize: 13}}>
        <span>Note</span>
        <span style={{color: "var(--color-graphite)", fontWeight: 500}}>loved the zine ✦</span>
      </div>
      <div className="hs-note">
        <ShieldCheckIcon width={14} height={14} /> Sealed to her passport key
      </div>
      <div className="hs-note">
        <EyeOffIcon width={14} height={14} /> The tip never names her
      </div>
      <div className="hs-cta-fake">Send silently</div>
    </div>
  );
}

/** 05: client-side inbox scan. */
export function InboxScreen() {
  const seal = (
    <span className="hs-seal">
      <InboxIcon width={14} height={14} />
    </span>
  );
  return (
    <div className="hs-sheet hs-sheet-plain">
      <div className="hs-screen-title">Inbox</div>
      <div className="hs-big-q">3 new tips</div>
      <div className="hs-note">
        <ShieldCheckIcon width={14} height={14} /> Found by your key, on this phone
      </div>
      <div>
        <Row letter={seal} title="25 NIGHT" sub="“loved the zine ✦”" amt="Claim" />
        <Row letter={seal} title="10 NIGHT" sub="“for the coffee”" amt="Claim" />
        <Row letter={seal} title="5 NIGHT" sub="no note" amt="Claim" />
      </div>
      <div className="hs-tv" style={{gap: 6}}>
        <span className="hs-sub">Scanned 1,284 sealed notes</span>
        <span className="hs-sub">Server inbox: none</span>
      </div>
    </div>
  );
}

/** 06: claim with a ZK proof. */
export function ProofScreen() {
  return (
    <div className="hs-sheet hs-sheet-plain">
      <div className="hs-screen-title">Claim</div>
      <span className="hs-check">
        <CheckIcon width={26} height={26} />
      </span>
      <div className="hs-center">
        <span className="hs-sub">Claimed to your wallet</span>
        <span className="hs-amt-big">
          +25
          <small className="hs-unit">
            <NightCoin size={14} /> NIGHT
          </small>
        </span>
      </div>
      <div className="hs-proof">
        <span>circuit hushh_vault.claim</span>
        <span>
          knows(secret) <b>✓</b>
        </span>
        <span>
          not_claimed(note) <b>✓</b>
        </span>
        <span>
          proof <b>verified by Midnight</b>
        </span>
      </div>
      <div className="hs-note">
        <EyeOffIcon width={14} height={14} /> Her secret stayed a private witness
      </div>
    </div>
  );
}

/** 07: scratch card / claim link for someone with no passport. */
export function GiftScreen() {
  return (
    <div className="hs-sheet hs-sheet-plain">
      <div className="hs-screen-title">Scratch card</div>
      <div className="hs-big-q">For Jo, who&apos;s new here</div>
      <div className="hs-scratch">
        <span style={{fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em"}}>50 NIGHT</span>
        <span className="hs-scratch-foil" />
      </div>
      <div className="hs-link-row">
        <LinkIcon width={12} height={12} /> hushh.accuracy.wtf/c#k9f…
      </div>
      <div className="hs-note">
        <ShieldCheckIcon width={14} height={14} /> Works before Jo has a passport
      </div>
      <div className="hs-cta-fake">Share link</div>
    </div>
  );
}
