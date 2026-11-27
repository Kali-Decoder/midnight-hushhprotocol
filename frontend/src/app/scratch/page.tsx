import {ScratchPaymentForm} from "@/components/ScratchPaymentForm";

export const metadata = {title: "Create Gift Card", alternates: {canonical: "/scratch"}};

const STEPS = [
  {n: "01", label: "Design", hint: "Name, color, note"},
  {n: "02", label: "Fund", hint: "Token + amount"},
  {n: "03", label: "Send", hint: "Private deposit"},
] as const;

export default function ScratchPage() {
  return (
    <div className="animate-fade mx-auto w-full max-w-6xl px-4 pb-14 pt-2 sm:px-6 lg:px-8">
      <header className="mb-7 sm:mb-9">
        <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-graphite">
          Gift studio
        </p>
        <h1 className="mt-2 max-w-2xl text-[2.4rem] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[3.4rem]">
          Create a scratch gift card
        </h1>
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-graphite sm:text-sm">
          Design a lottery-style ticket, lock NIGHT in the Hushh vault on
          Midnight, and send it to a .night name or any X handle. They scratch
          to reveal, then claim with a proof.
        </p>

        <ol className="mt-6 flex flex-wrap gap-2 sm:gap-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="card flex min-w-[9.5rem] flex-1 items-start gap-2.5 px-4 py-3.5 sm:max-w-[14rem]"
            >
              <span className="font-mono text-[11px] font-semibold tabular-nums text-signal">
                {s.n}
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-tight text-ink">
                  {s.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-graphite">
                  {s.hint}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </header>

      <ScratchPaymentForm />
    </div>
  );
}
