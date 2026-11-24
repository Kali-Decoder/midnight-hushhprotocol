import type {Metadata} from "next";
import Link from "next/link";
import ProtocolFlow from "@/components/ProtocolFlow";
import HowItWorks from "@/components/HowItWorks";
import InteractiveNoteStrip from "@/components/InteractiveNoteStrip";
import StatsBand from "@/components/landing/StatsBand";

export const metadata: Metadata = {
  title: "Protocol · Hushh Protocol",
  description:
    "How Hushh works on Midnight: the night_registry and hushh_vault Compact contracts, sealed tips and zero-knowledge claims.",
};

export default function ProtocolPage() {
  return (
    <div className="flex w-full flex-col items-center gap-24 text-center sm:gap-32">
      <div id="architecture" className="landing-band w-full max-w-6xl scroll-mt-28">
        <ProtocolFlow />
      </div>
      <StatsBand />
      <div id="how-it-works" className="landing-band w-full max-w-5xl scroll-mt-28">
        <HowItWorks />
      </div>
      <InteractiveNoteStrip />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/send"
          className="inline-flex items-center rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-paper shadow-[0_12px_28px_-14px_rgba(10,10,10,0.5)] transition hover:bg-ink/90 active:scale-[0.98]"
        >
          Send NIGHT
        </Link>
        <Link
          href="/passport"
          className="inline-flex items-center rounded-full border border-fog bg-white/90 px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:border-graphite"
        >
          Midnight Passport
        </Link>
      </div>
    </div>
  );
}
