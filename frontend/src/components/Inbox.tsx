"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {commitmentHex, type OwnedTip} from "@hushh/sdk";
import {useAccount} from "@/lib/midnight/hooks";
import {claimTip, listInbox} from "@/lib/api";
import {explorerTx, fromTokenUnits, NETWORK_NAME, resolvePoolToken} from "@/lib/config";
import {shortAddr} from "@/lib/address";
import {toast} from "@/lib/toast";
import {formatError, formatErrorTitle} from "@/lib/errors";
import {useSession} from "@/hooks/useSession";
import {ConnectButton} from "@/components/ConnectButton";
import {NetworkGate} from "@/components/NetworkGate";
import {PaymentShareSuccessModal} from "@/components/PaymentShareSuccessModal";
import {
  CheckIcon,
  ExternalLinkIcon,
  LoaderIcon,
} from "@/components/icons";
import {ErrorBanner, Panel} from "@/components/ui";
import type {PaymentShareDetails} from "@/lib/sharePayment";
import {
  encodeScratchClaimPayload,
  openedGifts,
  scratchClaimPath,
  type ScratchClaimPayload,
} from "@/lib/scratchGift";

type ClaimStep = "idle" | "proving" | "done" | "error";

function claimStepLabel(step: ClaimStep): string {
  return step === "proving" ? "Proving…" : step === "done" ? "Claimed" : "Claim";
}

/** A tip addressed to this passport, as the inbox renders it. */
interface Note {
  id: string;
  commitment: string;
  claimed: boolean;
  claimTxHash?: string;
  amount: string;
  tokenSymbol: string;
}

interface DecryptedRow {
  note: Note;
  tip: OwnedTip;
  payload: {kind: "standard"} | {kind: "scratch"; claim: ScratchClaimPayload};
  error?: string;
}

type InboxTab = "unclaimed" | "gifts" | "claimed";

const CLAIM_TX_KEY = "hush.claimTxByNote";

function readClaimTxMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CLAIM_TX_KEY) || "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function rememberClaimTx(noteId: string, txHash: string) {
  const map = readClaimTxMap();
  map[noteId] = txHash;
  localStorage.setItem(CLAIM_TX_KEY, JSON.stringify(map));
}

function txForNote(note: Note): string | undefined {
  if (note.claimTxHash) return note.claimTxHash;
  return readClaimTxMap()[note.id];
}

export function Inbox() {
  const {address, isConnected} = useAccount();
  const {isSignedIn, user: me, hasProfile, keys} = useSession();
  const [rows, setRows] = useState<DecryptedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimStep, setClaimStep] = useState<ClaimStep>("idle");
  const [txHash, setTxHash] = useState("");
  const [tab, setTab] = useState<InboxTab>("unclaimed");
  const [shareSuccess, setShareSuccess] = useState<{
    details: PaymentShareDetails;
    txHash: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!keys) {
      setError("Unlock your passport to read your inbox.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const tips = await listInbox(keys);
      const localTx = readClaimTxMap();
      const gifts = openedGifts();
      const tok = resolvePoolToken();
      setRows(
        tips.map((tip) => {
          const id = commitmentHex(tip.commitment);
          const gift = gifts[id];
          return {
            tip,
            note: {
              id,
              commitment: id,
              claimed: tip.claimed,
              claimTxHash: localTx[id],
              amount: fromTokenUnits(tip.amount, tok.decimals),
              tokenSymbol: tok.symbol,
            },
            payload: gift ? {kind: "scratch" as const, claim: gift} : {kind: "standard" as const},
          };
        })
      );
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [keys]);

  useEffect(() => {
    if (isSignedIn) void load();
  }, [isSignedIn, load]);

  const giftRows = useMemo(
    () =>
      rows.filter((r) => !r.note.claimed && r.payload?.kind === "scratch"),
    [rows]
  );
  const unclaimedRows = useMemo(
    () =>
      rows.filter((r) => !r.note.claimed && r.payload?.kind !== "scratch"),
    [rows]
  );
  const claimedRows = useMemo(
    () => rows.filter((r) => r.note.claimed),
    [rows]
  );
  const visibleRows =
    tab === "gifts"
      ? giftRows
      : tab === "unclaimed"
        ? unclaimedRows
        : claimedRows;

  async function handleClaim(row: DecryptedRow) {
    if (!address || !keys || row.note.claimed) return;
    setError("");
    setTxHash("");
    setClaimingId(row.note.id);
    setClaimStep("proving");

    try {
      const {txId: hash} = await claimTip(row.tip, keys);
      setTxHash(hash);
      rememberClaimTx(row.note.id, hash);

      setClaimStep("done");
      setShareSuccess({
        details: {
          kind: "claimed",
          fromUsername: "",
          toLabel: me?.username ? `@${me.username}` : shortAddr(address),
          amount: row.note.amount,
          tokenSymbol: row.note.tokenSymbol,
          tokenLogo: resolvePoolToken().logo,
        },
        txHash: hash,
      });
      toast.success("Claimed. NIGHT sent to your wallet.", explorerTx(hash) ? {
        href: explorerTx(hash),
        hrefLabel: "View on explorer",
      } : undefined);
      setRows((prev) =>
        prev.map((r) =>
          r.note.id === row.note.id
            ? {...r, note: {...r.note, claimed: true, claimTxHash: hash}}
            : r
        )
      );
      setTab("claimed");
    } catch (e) {
      setClaimStep("error");
      const msg = formatError(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setClaimingId(null);
      setTimeout(() => setClaimStep("idle"), 800);
    }
  }

  if (!hasProfile && !isSignedIn) {
    return (
      <Panel className="space-y-4 text-center text-sm text-graphite">
        <p>Connect your wallet and claim your .night passport to get paid.</p>
        {isConnected ? (
          <a href="/register" className="btn-primary">
            Claim passport
          </a>
        ) : (
          <ConnectButton />
        )}
      </Panel>
    );
  }

  if (hasProfile && !isSignedIn) {
    return (
      <Panel className="space-y-4 text-center">
        <p className="text-sm text-graphite">
          Passport @{me?.username} found. Unlock it with your passkey to read your inbox.
        </p>
        <a href="/register" className="btn-primary">
          Sign in
        </a>
      </Panel>
    );
  }

  if (!isConnected) {
    return (
      <Panel className="space-y-4 text-center">
        <p className="text-sm text-graphite">
          Connect a Midnight wallet to receive the NIGHT you claim.
        </p>
        <ConnectButton label="Connect wallet" />
      </Panel>
    );
  }

  const busy = claimingId !== null;

  return (
    <NetworkGate>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <p className="text-sm leading-relaxed text-graphite">
            Tips sealed to your passport, found by scanning the vault on{" "}
            {NETWORK_NAME}. Claiming proves you hold the note secret.
          </p>
          <button
            type="button"
            onClick={load}
            disabled={loading || busy}
            className="shrink-0 text-sm font-medium text-ink hover:underline disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Inbox categories"
          className="inline-flex rounded-full border border-fog bg-white p-1"
        >
          {(
            [
              {
                id: "unclaimed" as const,
                label: "Unclaimed",
                count: unclaimedRows.length,
              },
              {
                id: "gifts" as const,
                label: "Gift cards",
                count: giftRows.length,
              },
              {
                id: "claimed" as const,
                label: "Claimed",
                count: claimedRows.length,
              },
            ]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "text-graphite hover:text-ink"
                }`}
              >
                {t.label}
                <span
                  className={`ml-1.5 font-mono text-xs ${
                    active ? "text-paper/70" : "text-graphite/70"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <ErrorBanner title={formatErrorTitle(error)} message={error} />
        ) : null}
        {txHash && explorerTx(txHash) ? (
          <a
            href={explorerTx(txHash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-fog bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-graphite"
          >
            Latest claim on explorer
            <ExternalLinkIcon className="h-3.5 w-3.5 text-graphite" />
          </a>
        ) : null}

        {loading && rows.length === 0 ? (
          <Panel className="flex justify-center py-10">
            <LoaderIcon className="h-6 w-6 animate-spin text-graphite" />
          </Panel>
        ) : null}

        {!loading && rows.length === 0 && !error ? (
          <Panel className="py-10 text-center text-sm text-graphite">
            No tips yet. Share your .night name or X handle to get paid.
          </Panel>
        ) : null}

        {!loading && rows.length > 0 && visibleRows.length === 0 ? (
          <Panel className="py-10 text-center text-sm text-graphite">
            {tab === "unclaimed"
              ? "Nothing to claim."
              : tab === "gifts"
                ? "No scratch gift cards yet."
                : "No claimed tips yet."}
          </Panel>
        ) : null}

        <ul className="space-y-3">
          {visibleRows.map((row) => {
            const {note, payload, error: decErr} = row;
            const isThis = claimingId === note.id;
            const claimTx = txForNote(note);
            const scratchLink =
              payload?.kind === "scratch"
                ? scratchClaimPath(encodeScratchClaimPayload(payload.claim))
                : null;
            return (
              <li key={note.id}>
                <Panel className="!p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      {payload ? (
                        <p className="text-2xl font-bold tracking-tight">
                          {note.amount}{" "}
                          <span className="text-base font-semibold text-graphite">
                            {note.tokenSymbol}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-graphite">Could not decrypt</p>
                      )}
                      {payload?.kind === "scratch" ? (
                        <p className="mt-2 inline-flex items-center rounded-full bg-paper px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-graphite">
                          {payload.claim.meta.title || "Scratch gift card"}
                        </p>
                      ) : null}
                      <p className="mt-2 truncate font-mono text-[11px] text-graphite">
                        {note.commitment}
                      </p>
                      {decErr ? (
                        <p className="mt-1 text-xs text-red-600">{decErr}</p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      {note.claimed ? (
                        <>
                          <span className="inline-flex items-center justify-center gap-1 font-mono text-[11px] font-medium text-signal">
                            <CheckIcon className="h-3.5 w-3.5" />
                            claimed
                          </span>
                          {claimTx && explorerTx(claimTx) ? (
                            <a
                              href={explorerTx(claimTx)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-ink/85"
                            >
                              View claim
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                        </>
                      ) : payload?.kind === "scratch" && scratchLink ? (
                        <a
                          href={scratchLink}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-ink/85"
                        >
                          Open scratch card
                        </a>
                      ) : payload ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleClaim(row)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
                        >
                          {isThis ? (
                            <LoaderIcon className="h-4 w-4 animate-spin" />
                          ) : null}
                          {isThis ? claimStepLabel(claimStep) : "Claim"}
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-graphite">
                          locked
                        </span>
                      )}
                    </div>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      </div>

      {shareSuccess ? (
        <PaymentShareSuccessModal
          details={shareSuccess.details}
          depositHash={shareSuccess.txHash}
          onClose={() => setShareSuccess(null)}
        />
      ) : null}
    </NetworkGate>
  );
}
