import {MailIcon, XBrandIcon} from "@/components/icons";

type Item = {kind: "name" | "x" | "email" | "fact"; text: string};

const ITEMS: Item[] = [
  {kind: "x", text: "@maria"},
  {kind: "fact", text: "sealed to her passport"},
  {kind: "name", text: "alice.night"},
  {kind: "fact", text: "claimed with a ZK proof"},
  {kind: "email", text: "ada@email.com"},
  {kind: "fact", text: "no seed phrase"},
  {kind: "x", text: "@kai"},
  {kind: "fact", text: "paid in NIGHT"},
  {kind: "name", text: "bob.night"},
  {kind: "fact", text: "passkey-owned"},
];

function Chip({item}: {item: Item}) {
  if (item.kind === "fact") {
    return (
      <span className="inline-flex items-center gap-3 px-2 font-mono text-[11px] uppercase tracking-[0.2em] text-graphite">
        <span className="h-1 w-1 rounded-full bg-signal" />
        {item.text}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-fog bg-white/80 px-4 py-2 text-sm font-semibold tracking-[-0.01em] text-ink shadow-[0_8px_20px_-16px_rgba(10,10,10,0.4)]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-paper">
        {item.kind === "x" ? (
          <XBrandIcon className="h-2.5 w-2.5" />
        ) : item.kind === "email" ? (
          <MailIcon className="h-3 w-3" />
        ) : (
          <span className="text-[9px] font-bold">N</span>
        )}
      </span>
      {item.text}
    </span>
  );
}

/** Endless strip of the ways someone can be paid. Pauses on hover. */
export default function PayMarquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee group relative w-full overflow-hidden py-2" aria-label="Pay a .night name, an X handle or an email">
      <div className="marquee-track flex w-max items-center gap-5 group-hover:[animation-play-state:paused]">
        {row.map((item, i) => (
          <Chip key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
