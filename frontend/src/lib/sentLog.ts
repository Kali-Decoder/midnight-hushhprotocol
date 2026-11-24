// Local record of tips this browser sent. The vault deliberately does not
// record senders on-chain, so "Sent" history only exists on the sender's device.

export interface SentTip {
  commitment: string;
  txId: string;
  amount: string;
  toLabel: string;
  kind: "passport" | "link" | "scratch";
  /** Claim link (link / unregistered recipients), kept so the sender can resend it. */
  claimUrl?: string;
  createdAt: number;
}

const KEY = "hushh.sent";

export function listSent(): SentTip[] {
  if (typeof window === "undefined") return [];
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || "[]") as SentTip[];
    return Array.isArray(items) ? items.sort((a, b) => b.createdAt - a.createdAt) : [];
  } catch {
    return [];
  }
}

export function recordSent(t: Omit<SentTip, "createdAt">) {
  const items = listSent().filter((x) => x.commitment !== t.commitment);
  items.push({...t, createdAt: Date.now()});
  localStorage.setItem(KEY, JSON.stringify(items));
}
