import type {Metadata} from "next";
import Link from "next/link";
import PassportShowcase from "@/components/landing/PassportShowcase";
import InteractivePillars from "@/components/InteractivePillars";

export const metadata: Metadata = {
  title: "Midnight Passport",
  alternates: {canonical: "/passport"},
  description:
    "Own a .night name with a passkey, link your X and email, and get paid in NIGHT on Midnight.",
};

export default function PassportPage() {
  return (
    <div className="flex w-full flex-col items-center gap-24 text-center sm:gap-32">
      <PassportShowcase />
      <InteractivePillars />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="inline-flex items-center rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-paper shadow-[0_12px_28px_-14px_rgba(10,10,10,0.5)] transition hover:bg-ink/90 active:scale-[0.98]"
        >
          Claim your .night name
        </Link>
        <Link
          href="/protocol"
          className="inline-flex items-center rounded-full border border-fog bg-white/90 px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:border-graphite"
        >
          How the protocol works
        </Link>
      </div>
    </div>
  );
}
