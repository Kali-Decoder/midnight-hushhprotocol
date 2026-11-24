"use client";

import {useEffect, useRef, useState} from "react";

const STATS = [
  {value: 0, label: "Seed phrases", note: "a passkey owns your passport"},
  {value: 3, label: "Ways to be paid", note: ".night name, @X handle, email"},
  {value: 1, label: "Proof to claim", note: "Compact circuit, verified by Midnight"},
  {value: 8, label: "Compact circuits", note: "registry + vault, all on-chain"},
] as const;

function Counter({to, run}: {to: number; run: boolean}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (to === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    const t0 = performance.now();
    const dur = 900 + to * 60;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return <>{n}</>;
}

/** Four facts about the protocol that count up when scrolled into view. */
export default function StatsBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      {threshold: 0.4},
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full max-w-5xl">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.35rem] border border-fog bg-fog sm:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`stat-cell bg-white/90 px-5 py-7 text-left sm:px-6 ${run ? "stat-in" : "opacity-0"}`}
            style={{animationDelay: `${i * 90}ms`}}
          >
            <p className="text-5xl font-bold tracking-[-0.04em] text-ink sm:text-6xl">
              <Counter to={s.value} run={run} />
            </p>
            <p className="mt-3 text-sm font-semibold text-ink">{s.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-graphite">{s.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
