"use client";

import {useEffect, useRef, useState} from "react";
import {motion, useInView, useReducedMotion} from "motion/react";
import {EyeOffIcon, LinkIcon, MailIcon, XBrandIcon} from "@/components/icons";

/**
 * Landing graph: a private sender → your .night passport → every handle it
 * is linked to. Lines draw in when the section scrolls into view, links flip
 * from "Linking…" to "Linked", then light pulses keep flowing along them.
 * Wide screens lay out left → right; phones stack top → bottom.
 */

const NAME = "beo_halfhand";

type Target = {
  key: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
  /** Dashed amber branch: not a linked identity, works without an account. */
  dashed?: boolean;
};

const TARGETS: Target[] = [
  {key: "x", title: `@${NAME}`, sub: "X · verified on-chain", icon: <XBrandIcon className="h-3 w-3" />},
  {key: "email", title: "beo•••@gmail.com", sub: "Email · only a hash on-chain", icon: <MailIcon className="h-3.5 w-3.5" />},
  {
    key: "night",
    title: `${NAME}.night`,
    sub: "Name · owned by your passkey",
    icon: <span className="font-mono text-[10px] font-bold">.n</span>,
  },
  {
    key: "link",
    title: "Claim link",
    sub: "Gift card · no account needed",
    icon: <LinkIcon className="h-3.5 w-3.5" />,
    dashed: true,
  },
];

type Pt = {x: number; y: number};
type Layout = {
  w: number;
  h: number;
  sender: Pt;
  center: Pt;
  /** Center circle radius, in viewBox units. */
  r: number;
  targets: Pt[];
  senderPath: string;
  paths: string[];
  /** Node width as a share of the container. */
  nodeW: string;
};

function wideLayout(): Layout {
  const w = 1000;
  const h = 480;
  const center = {x: 500, y: 240};
  const r = 46;
  const ys = [90, 190, 290, 390];
  const tx = 860; // node centers; node is 24% wide → left edge 740
  return {
    w,
    h,
    sender: {x: 130, y: 240},
    center,
    r,
    targets: ys.map((y) => ({x: tx, y})),
    senderPath: `M250,240 L${center.x - r},240`,
    paths: ys.map(
      (y) => `M${center.x + r},${center.y} C${center.x + 150},${center.y} ${tx - 230},${y} ${tx - 120},${y}`,
    ),
    nodeW: "24%",
  };
}

function tallLayout(): Layout {
  // Phones: a trunk runs down the left and branches into a column of cards,
  // so no line crosses a label or hides behind another card.
  const w = 1000;
  const ys = [720, 920, 1120, 1320];
  const h = 1420;
  const center = {x: 500, y: 330};
  const r = 92;
  const trunk = 110;
  const nodeLeft = 200;
  return {
    w,
    h,
    sender: {x: 500, y: 90},
    center,
    r,
    targets: ys.map((y) => ({x: 590, y})), // 78% wide → left edge 200
    senderPath: `M500,165 L500,${center.y - r}`,
    paths: ys.map(
      (y) =>
        `M500,520 C500,600 ${trunk},580 ${trunk},660 L${trunk},${y - 50} Q${trunk},${y} ${trunk + 50},${y} L${nodeLeft},${y}`,
    ),
    nodeW: "78%",
  };
}

function useWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const EASE = [0.16, 1, 0.3, 1] as const;

export default function IdentityGraph() {
  const wide = useWide();
  const L = wide ? wideLayout() : tallLayout();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {once: true, amount: 0.35});
  const reduce = useReducedMotion();
  // How many identities have finished linking (drives the "Linked" flip).
  const [linked, setLinked] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setLinked(TARGETS.length);
      return;
    }
    const timers = TARGETS.map((_, i) => window.setTimeout(() => setLinked(i + 1), 1300 + i * 450));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const signal = "#00a676";
  const amber = "#e8b54a";

  return (
    <section className="landing-band w-full max-w-6xl">
      <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-graphite">One name, every handle</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
          Link once.
          <span className="text-graphite"> Get paid anywhere.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-graphite sm:text-base">
          Your .night passport sits in the middle. Whichever handle a sender knows, the payment lands in
          the same private inbox, and the sender stays hidden.
        </p>
      </div>

      <div
        ref={ref}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-ink text-left text-paper shadow-[0_30px_80px_-40px_rgba(10,10,10,0.7)]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4 sm:px-7 sm:py-5">
          <p className="truncate text-sm font-semibold tracking-tight sm:text-lg">
            Sender <span className="text-paper/40">→</span> {NAME}.night{" "}
            <span className="text-paper/40">→</span> <span className="text-paper/70">every handle</span>
          </p>
          <p className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-paper/50">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-signal/60 motion-reduce:hidden" />
              <span className="relative h-2 w-2 rounded-full bg-signal" />
            </span>
            Preprod
          </p>
        </header>

        <div className="relative" style={{aspectRatio: `${L.w} / ${L.h}`}}>
          {/* Soft glow behind the passport */}
          <div
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              left: pct(L.center.x, L.w),
              top: pct(L.center.y, L.h),
              width: wide ? "46%" : "90%",
              aspectRatio: "1",
              background: "radial-gradient(circle, rgba(0,166,118,0.22), transparent 65%)",
            }}
          />

          <svg viewBox={`0 0 ${L.w} ${L.h}`} className="absolute inset-0 h-full w-full" aria-hidden>
            {/* Sender → passport */}
            <motion.path
              d={L.senderPath}
              fill="none"
              stroke={signal}
              strokeOpacity={0.7}
              strokeWidth={wide ? 1.6 : 3}
              initial={{pathLength: 0}}
              animate={inView ? {pathLength: 1} : {}}
              transition={{duration: 0.7, ease: EASE}}
            />
            {L.paths.map((d, i) => {
              const t = TARGETS[i];
              const color = t.dashed ? amber : signal;
              return (
                <g key={`${t.key}-${wide}`}>
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeOpacity={i < linked ? 0.75 : 0.35}
                    strokeWidth={wide ? 1.6 : 3}
                    strokeDasharray={t.dashed ? (wide ? "5 6" : "10 12") : undefined}
                    initial={t.dashed ? {opacity: 0} : {pathLength: 0}}
                    animate={inView ? (t.dashed ? {opacity: 1} : {pathLength: 1}) : {}}
                    transition={{duration: 0.9, delay: 0.55 + i * 0.12, ease: EASE}}
                  />
                  {/* Light pulse travelling to each handle once it's linked */}
                  {!reduce && i < linked ? (
                    <circle r={wide ? 3.5 : 7} fill={color}>
                      <animateMotion dur={`${2.4 + i * 0.35}s`} repeatCount="indefinite" path={d} />
                      <animate
                        attributeName="opacity"
                        values="0;1;1;0"
                        keyTimes="0;0.15;0.85;1"
                        dur={`${2.4 + i * 0.35}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  ) : null}
                </g>
              );
            })}
            {!reduce && inView ? (
              <circle r={wide ? 3.5 : 7} fill={signal}>
                <animateMotion dur="1.8s" repeatCount="indefinite" path={L.senderPath} />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="1.8s" repeatCount="indefinite" />
              </circle>
            ) : null}
          </svg>

          {/* Sender node */}
          <Node at={L.sender} L={L} delay={0.1} show={inView}>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-mono text-[12px] font-semibold sm:text-[13px]">Anyone</p>
              <EyeOffIcon className="h-3.5 w-3.5 shrink-0 text-paper/50" />
            </div>
            <p className="truncate text-[10px] text-paper/50 sm:text-[11px]">Sender · stays private</p>
          </Node>

          {/* Passport */}
          <motion.div
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{left: pct(L.center.x, L.w), top: pct(L.center.y, L.h), width: pct(L.r * 2, L.w)}}
            initial={{opacity: 0, scale: 0.6}}
            animate={inView ? {opacity: 1, scale: 1} : {}}
            transition={{type: "spring", stiffness: 200, damping: 18, delay: 0.35}}
          >
            <div className="relative flex aspect-square w-full items-center justify-center rounded-full bg-signal shadow-[0_0_40px_6px_rgba(0,166,118,0.45)]">
              {!reduce ? (
                <span className="absolute inset-0 animate-ping rounded-full bg-signal/30 [animation-duration:2.4s]" />
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logomark.png" alt="" className="relative w-[58%] rounded-[22%]" />
            </div>
            <p className="mt-2 whitespace-nowrap font-mono text-[11px] font-semibold text-paper sm:text-[12px]">
              {NAME}.night
            </p>
            <p className="whitespace-nowrap text-[10px] text-paper/45 sm:text-[11px]">your passport</p>
          </motion.div>

          {/* Linked identities */}
          {TARGETS.map((t, i) => {
            const done = i < linked;
            return (
              <Node key={t.key} at={L.targets[i]} L={L} delay={0.9 + i * 0.12} show={inView} dashed={t.dashed}>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      t.dashed ? "bg-amber/20 text-amber" : "bg-white/10 text-paper"
                    }`}
                  >
                    {t.icon}
                  </span>
                  <p className="min-w-0 truncate font-mono text-[11px] font-semibold sm:text-[13px]">{t.title}</p>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-paper/50 sm:text-[11px]">
                  {done ? (
                    <motion.span key="done" initial={{opacity: 0}} animate={{opacity: 1}}>
                      {t.sub}
                    </motion.span>
                  ) : (
                    <span className="text-paper/35">Linking…</span>
                  )}
                </p>
              </Node>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Node({
  at,
  L,
  delay,
  show,
  dashed,
  children,
}: {
  at: Pt;
  L: Layout;
  delay: number;
  show: boolean;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-[#141414]/95 px-2.5 py-2 backdrop-blur-sm sm:px-3.5 sm:py-2.5 ${
        dashed ? "border-dashed border-amber/40" : "border-white/[0.12]"
      }`}
      style={{left: pct(at.x, L.w), top: pct(at.y, L.h), width: L.nodeW}}
      initial={{opacity: 0, y: 8}}
      animate={show ? {opacity: 1, y: 0} : {}}
      transition={{duration: 0.5, delay, ease: EASE}}
    >
      {children}
    </motion.div>
  );
}
