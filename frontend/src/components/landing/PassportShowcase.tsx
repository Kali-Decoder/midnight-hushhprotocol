"use client";

import {useEffect, useRef, useState} from "react";
import Reveal from "@/components/Reveal";
import {MidnightPassportCard} from "@/components/MidnightPassportCard";
import {MailIcon, ShieldCheckIcon, XBrandIcon} from "@/components/icons";
import type {PublicUser} from "@/shared";

const DEMO: PublicUser = {
  id: "maria",
  username: "maria",
  wallet: "mn_addr_preprod1demo0000000000000000000000000000000000000000000maria",
  bulletPublicKey: "",
  tipPk: "51904456469385646959126479635092937085658665168591195040339906279892974555340",
  index: 41,
};

const STEPS = [
  {
    icon: <ShieldCheckIcon className="h-4 w-4" />,
    title: "Passkey",
    body: "Face or Touch ID creates your passport keys. No seed phrase, nothing to write down.",
  },
  {
    icon: <XBrandIcon className="h-3.5 w-3.5" />,
    title: "Link X",
    body: "Sign in with X. An attester signs the link and the registry checks it in a Compact circuit.",
  },
  {
    icon: <MailIcon className="h-4 w-4" />,
    title: "Link email",
    body: "Verify a one-time code. Only a hash of your email goes on-chain, next to your X.",
  },
] as const;

/** Midnight Passport demo: credentials light up one by one while in view. */
export default function PassportShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0); // 0 passkey, 1 +X, 2 +email
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {threshold: 0.35});
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage(2);
      return;
    }
    const t = window.setInterval(() => setStage((s) => (s + 1) % 4), 1700);
    return () => window.clearInterval(t);
  }, [visible]);

  const shown = Math.min(stage, 2);
  const user: PublicUser = {
    ...DEMO,
    twitterUsername: shown >= 1 ? "maria" : null,
    emailLinked: shown >= 2,
  };

  return (
    <section ref={ref} id="passport" className="landing-band w-full max-w-6xl scroll-mt-28">
      <div className="grid items-center gap-12 text-left *:min-w-0 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-graphite">Midnight Passport</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            One passport.
            <br />
            <span className="text-graphite">Every way to pay you.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-graphite sm:text-base">
            Your .night name is owned by a passkey. Link your X and your email, and anyone can pay you at
            whichever one they know.
          </p>

          <ol className="mt-8 space-y-3">
            {STEPS.map((s, i) => {
              const on = shown >= i;
              const current = shown === i;
              return (
                <li
                  key={s.title}
                  className={`showcase-step flex items-start gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-500 ${
                    current
                      ? "border-ink/15 bg-white shadow-[0_18px_40px_-28px_rgba(10,10,10,0.4)]"
                      : "border-transparent bg-transparent"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                      on ? "bg-ink text-paper" : "bg-fog/70 text-graphite"
                    }`}
                  >
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold transition-colors duration-500 ${on ? "text-ink" : "text-graphite"}`}>
                      <span className="mr-2 font-mono text-xs text-graphite">0{i + 1}</span>
                      {s.title}
                      {on ? <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-signal align-middle" /> : null}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-graphite">{s.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>

        <Reveal delay={120} className="order-first lg:order-none">
          <div className="showcase-float relative mx-auto w-full max-w-xl">
            <div aria-hidden className="showcase-halo" />
            <MidnightPassportCard user={user} method="passkey" unlocked />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
