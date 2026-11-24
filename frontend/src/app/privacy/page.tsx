import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy · Hushh Protocol",
  description:
    "What Hushh Protocol hides on Midnight, and what it does not. Midnight Passport, sealed tips, ZK claims, honest limits.",
};

const ITEM = "font-semibold text-ink";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl py-12 text-left">
      <h1 className="text-4xl font-bold tracking-tight">Privacy</h1>
      <p className="mt-4 text-lg text-graphite">
        What Hushh Protocol hides on Midnight, and what it does not. Stated plainly, because
        privacy claims you can not check are worthless.
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">
        What stays private
      </h2>
      <ul className="mt-4 space-y-4 text-graphite">
        <li>
          <span className={ITEM}>
            Your passport secret never leaves your device.
          </span>{" "}
          Midnight Passport derives your keys from a passkey every time you sign
          in. Nothing secret is stored or sent; the chain only holds hashes of
          your keys.
        </li>
        <li>
          <span className={ITEM}>
            Payments do not name the recipient.
          </span>{" "}
          A tip is stored under a commitment bound to the recipient&apos;s key,
          with its note sealed to their X25519 key. Their .night name and X
          handle are never written into the payment.
        </li>
        <li>
          <span className={ITEM}>
            Claims prove, they do not reveal.
          </span>{" "}
          A Compact circuit proves the claimer knows the tip&apos;s secret and
          that it was never claimed. Midnight verifies the proof natively; the
          secret stays a private witness. A sender cannot claim back a tip sent
          to a passport.
        </li>
        <li>
          <span className={ITEM}>
            No backend inbox.
          </span>{" "}
          Recipients find their tips by trial-decrypting the vault on-chain.
          There is no server that learns who got paid.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">
        What does not
      </h2>
      <ul className="mt-4 space-y-4 text-graphite">
        <li>
          <span className={ITEM}>
            Amounts and wallets are public.
          </span>{" "}
          Tips are unshielded NIGHT. The sender&apos;s wallet, the amount, and
          the wallet that receives a claim are visible on-chain.
        </li>
        <li>
          <span className={ITEM}>
            A claim can be matched to its deposit.
          </span>{" "}
          This build checks claims against a plain map of commitments, so a
          claim reveals which deposit it spent. Observers can link the paying
          wallet to the claiming wallet. A Merkle-tree claim would hide that;
          it is planned, not shipped.
        </li>
        <li>
          <span className={ITEM}>
            Names and social links are public by design.
          </span>{" "}
          Your .night name, its payment keys, and a linked X handle sit in the
          registry so anyone can pay you. Linking X needs a signature from the
          Hushh attester, which checks your X sign-in.
        </li>
        <li>
          <span className={ITEM}>
            Claim links are bearer secrets.
          </span>{" "}
          Anyone holding a claim link can claim it. Send links over a channel
          you trust.
        </li>
        <li>
          <span className={ITEM}>
            This is a prototype.
          </span>{" "}
          Contracts are unaudited and run on Midnight test networks. Do not use
          them for real value.
        </li>
      </ul>

      <p className="mt-12 text-sm text-graphite">
        Network: Midnight (Ledger 9). Built with Compact, Midnight.js and
        Midnight Passport.
      </p>
    </div>
  );
}
