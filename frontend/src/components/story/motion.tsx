"use client";

/**
 * Motion building blocks for the story landing: smooth scroll (Lenis),
 * word-mask headline reveals, and the parallax phone stage.
 */

import "lenis/dist/lenis.css";
import Lenis from "lenis";
import {
  type MotionValue,
  type Variants,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {type ReactNode, useEffect, useRef} from "react";
import {MidnightMark, NightCoin} from "@/components/story/MidnightMark";
import {Phone} from "@/components/story/screens";

export const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------- Smooth scroll ---------- */

let lenis: Lenis | null = null;

/** Scroll to an element through Lenis when active, natively otherwise. */
export function scrollToEl(el: HTMLElement | null, offset = 0) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, {offset, duration: 1.4});
  else el.scrollIntoView({behavior: "smooth", block: "start"});
}

/** Inertial page scroll while mounted. Skipped for reduced-motion users. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      anchors: {offset: -24},
      smoothWheel: true,
    });
    lenis = instance;
    let raf = requestAnimationFrame(function loop(time) {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      lenis = null;
    };
  }, []);
  return null;
}

/* ---------- Word reveal ---------- */

const wordVariants: Variants = {
  hidden: {y: "110%", rotate: 4},
  show: (i: number) => ({
    y: "0%",
    rotate: 0,
    transition: {delay: 0.05 + i * 0.065, duration: 0.95, ease: EASE},
  }),
};

/**
 * Splits text into masked words that slide up in sequence. Put it inside a
 * motion element that switches between "hidden" and "show" variants.
 * `start` offsets the stagger index so several Words read as one line.
 */
export function Words({text, start = 0}: {text: string; start?: number}) {
  const words = text.split(" ").filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>
          <span className="hs-word">
            <motion.span custom={start + i} variants={wordVariants}>
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

/* ---------- Stage ---------- */

export type ChipPos = "tl" | "tr" | "ml" | "mr" | "bl" | "br";
export type Chip = {pos: ChipPos; tone?: "good" | "bad" | "dark" | "amber"; text: string; icon?: "midnight" | "night"};

const DEPTH = [1.7, 1.05, 2.3];

function ChipSlot({chip, i, progress, show}: {chip: Chip; i: number; progress: MotionValue<number>; show: boolean}) {
  const d = DEPTH[i % DEPTH.length]!;
  const y = useTransform(progress, [0, 1], [70 * d, -70 * d]);
  return (
    <motion.span className={`hs-chip-slot hs-chip-${chip.pos}`} style={{y}}>
      <motion.span
        style={{display: "inline-block"}}
        initial={{opacity: 0, scale: 0.6, y: 14, filter: "blur(6px)"}}
        animate={show ? {opacity: 1, scale: 1, y: 0, filter: "blur(0px)"} : undefined}
        transition={{delay: 0.55 + i * 0.14, type: "spring", stiffness: 230, damping: 17}}
      >
        <span className={`hs-chip ${chip.tone ? `hs-chip-${chip.tone}` : ""}`}>
          {chip.icon === "midnight" ? <MidnightMark width={18} height={18} className="hs-chip-ic" /> : null}
          {chip.icon === "night" ? <NightCoin size={18} /> : null}
          {chip.text}
        </span>
      </motion.span>
    </motion.span>
  );
}

/**
 * Blob + phone + floating chips. Scroll drives depth: the phone, blob and
 * each chip drift at different rates. The phone also tilts toward the
 * pointer. Content inside the phone cascades in via CSS once in view.
 */
export function Stage({chips, children, hero}: {chips: Chip[]; children: ReactNode; hero?: boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {once: true, amount: 0.3});

  const {scrollYProgress} = useScroll({target: ref, offset: ["start end", "end start"]});
  const progress = useSpring(scrollYProgress, {stiffness: 80, damping: 22, mass: 0.5});

  const phoneY = useTransform(progress, [0, 1], hero ? [0, -60] : [80, -80]);
  const phoneRotate = useTransform(progress, [0, 1], hero ? [0, -2] : [-3.5, 3.5]);
  const blobScale = useTransform(progress, [0, 0.5, 1], [0.82, 1, 1.12]);
  const blobY = useTransform(progress, [0, 1], [40, -40]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), {stiffness: 150, damping: 18});
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), {stiffness: 150, damping: 18});

  return (
    <div
      ref={ref}
      className={`hs-stage ${hero ? "hs-hero-stage" : ""}`}
      data-in={inView}
      style={{perspective: 1200}}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.span
        className="hs-blob"
        aria-hidden
        style={{scale: blobScale, y: blobY}}
        initial={{opacity: 0}}
        animate={inView ? {opacity: 1} : undefined}
        transition={{duration: 1.1, ease: EASE}}
      />
      <motion.div style={{position: "relative", y: phoneY, rotate: phoneRotate}}>
        <motion.div
          initial={{opacity: 0, y: 90, scale: 0.94}}
          animate={inView ? {opacity: 1, y: 0, scale: 1} : undefined}
          transition={{y: {type: "spring", stiffness: 90, damping: 18, mass: 0.9}, scale: {duration: 1, ease: EASE}, opacity: {duration: 0.6}}}
        >
          <motion.div style={{rotateX, rotateY, transformStyle: "preserve-3d"}}>
            <Phone>{children}</Phone>
          </motion.div>
        </motion.div>
      </motion.div>
      {chips.map((c, i) => (
        <ChipSlot key={c.text} chip={c} i={i} progress={progress} show={inView} />
      ))}
    </div>
  );
}
