"use client";

import {useEffect, useMemo, useState} from "react";
import {commitmentHex} from "@hushh/sdk";
import {useAccount} from "@/lib/midnight/hooks";
import {ConnectButton} from "@/components/ConnectButton";
import {ScratchRevealCard} from "@/components/ScratchRevealCard";
import {CheckIcon, ExternalLinkIcon, LoaderIcon} from "@/components/icons";
import {ErrorBanner, Panel} from "@/components/ui";
import {claimLinkTip, claimTip, listInbox} from "@/lib/api";
import {explorerTx, NETWORK_NAME} from "@/lib/config";
import {formatError} from "@/lib/errors";
import {getState} from "@/lib/midnight/store";
import {decodeScratchClaimPayload, rememberOpenedGift} from "@/lib/scratchGift";

type ClaimStep = "idle" | "finding" | "proving" | "done" | "error";

function claimStepLabel(step: ClaimStep): string {
  switch (step) {
    case "finding":
      return "Finding your tip in the vault…";
    case "proving":
      return `Proving and claiming on ${NETWORK_NAME}…`;
    case "done":
      return "Claimed";
    default:
      return "Claim";
  }
}

export function ClaimView({encoded}: {encoded: string}) {
  const {address, isConnected} = useAccount();
  const payload = useMemo(() => decodeScratchClaimPayload(encoded), [encoded]);
  const [armed, setArmed] = useState(false);
  const [claimStep, setClaimStep] = useState<ClaimStep>("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (payload) rememberOpenedGift(payload);
  }, [payload]);

  useEffect(() => {
    if (!armed || !payload || !isConnected || !address || done) return;
    const claimPayload = payload;
    let cancelled = false;

    async function runClaim() {
      setError("");
      try {
        let hash: string;
        if (claimPayload.link) {
          // Open link: the link secret is the note key.
          setClaimStep("proving");
          hash = (await claimLinkTip(claimPayload.link)).txId;
        } else {
          // Passport-bound gift: only the recipient's passport can claim.
          const keys = getState().keys;
          if (!keys) {
            throw new Error(
              `This card is for ${claimPayload.recipientUsername ? `@${claimPayload.recipientUsername}` : "a .night passport"}. Sign in with that passport, then come back to this link.`
            );
          }
          setClaimStep("finding");
          const tips = await listInbox(keys);
          const tip = tips.find((t) => commitmentHex(t.commitment) === claimPayload.commitment);
          if (!tip) throw new Error("This card was not sent to your passport.");
          if (tip.claimed) throw new Error("This card was already claimed.");
          if (cancelled) return;
          setClaimStep("proving");
          hash = (await claimTip(tip, keys)).txId;
        }
        if (cancelled) return;
        setTxHash(hash);
        setClaimStep("done");
        setDone(true);
      } catch (e) {
        if (cancelled) return;
        setClaimStep("error");
        setError(formatError(e));
      }
    }

    void runClaim();
    return () => {
      cancelled = true;
    };
  }, [armed, payload, isConnected, address, done]);

  if (!encoded || !payload) {
    return (
      <Panel className="space-y-3 text-left">
        <p className="text-sm font-medium text-ink">This claim link is invalid.</p>
        <p className="text-sm leading-relaxed text-graphite">
          Ask the sender for a fresh scratch card link.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <Panel className="space-y-4 !p-4 sm:!p-5">
        <div className="space-y-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-graphite">
            Lottery ticket
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {done ? "You won" : "Scratch to claim"}
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-graphite">
            {done
              ? "NIGHT is in your wallet. Keep the revealed card as your receipt."
              : `Scratch the silver panel. Once revealed, you prove you hold the note secret and claim on ${NETWORK_NAME}.`}
          </p>
        </div>

        <ScratchRevealCard
          meta={payload.meta}
          amountLabel={payload.amountLabel}
          tokenSymbol={payload.tokenSymbol}
          recipientLabel={
            payload.recipientUsername
              ? `@${payload.recipientUsername}`
              : undefined
          }
          disabled={done}
          revealed={done}
          stage
          tilt={done}
          onThreshold={() => setArmed(true)}
        />

        {error ? <ErrorBanner message={error} /> : null}

        {!armed ? (
          <div className="rounded-2xl border border-fog bg-paper/70 px-4 py-3 text-sm text-graphite">
            Scratch at least a third of the foil to start the claim.
          </div>
        ) : !isConnected ? (
          <div className="space-y-3 rounded-2xl border border-fog bg-paper/70 px-4 py-4 text-center">
            <p className="text-sm text-graphite">
              Prize revealed. Connect a Midnight wallet to receive the NIGHT.
            </p>
            <ConnectButton
              label="Connect wallet to claim"
              className="btn-primary"
            />
          </div>
        ) : done ? (
          <div className="space-y-3 rounded-2xl border border-signal/20 bg-signal/5 px-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal">
              <CheckIcon className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-ink">
              Scratch card claimed
            </p>
            <p className="text-sm text-graphite">
              {payload.amountLabel} {payload.tokenSymbol} claimed to your wallet.
            </p>
            {txHash && explorerTx(txHash) ? (
              <a
                href={explorerTx(txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
              >
                View claim transaction
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl bg-paper px-4 py-3.5">
            <LoaderIcon className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-ink" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                {claimStepLabel(claimStep)}
              </p>
              <p className="mt-1 text-xs text-graphite">
                Building the zero-knowledge proof and submitting the claim. Keep this page open.
              </p>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
