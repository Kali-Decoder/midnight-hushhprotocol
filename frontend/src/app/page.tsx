import HowItWorks from "@/components/HowItWorks";
import InteractiveNoteStrip from "@/components/InteractiveNoteStrip";
import InteractivePillars from "@/components/InteractivePillars";
import LandingCta from "@/components/LandingCta";
import LandingHero from "@/components/LandingHero";
import ProtocolFlow from "@/components/ProtocolFlow";
import IdentityGraph from "@/components/landing/IdentityGraph";
import PassportShowcase from "@/components/landing/PassportShowcase";
import PayMarquee from "@/components/landing/PayMarquee";
import ScrollProgress from "@/components/landing/ScrollProgress";
import StatsBand from "@/components/landing/StatsBand";

export default function Home() {
  return (
    <div className="flex w-full flex-col items-center gap-24 text-center sm:gap-32 md:gap-40">
      <ScrollProgress />

      <div className="flex w-full flex-col items-center gap-14 sm:gap-20">
        <LandingHero />
        <PayMarquee />
      </div>

      <PassportShowcase />

      <IdentityGraph />

      <div id="architecture" className="landing-band w-full max-w-6xl scroll-mt-28">
        <ProtocolFlow />
      </div>

      <StatsBand />

      <InteractivePillars />

      <div id="how-it-works" className="landing-band w-full max-w-5xl scroll-mt-28">
        <HowItWorks />
      </div>

      <InteractiveNoteStrip />

      <LandingCta />
    </div>
  );
}
